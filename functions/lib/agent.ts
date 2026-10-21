/**
 * Agent 循环（M6 / Agent 化）
 *
 * 单线程工具循环（tool-calling loop）：模型自主决定是否调用站内工具
 * （语义检索 / 阅读统计 / 评论 / 文章列表），工具结果回填后继续生成，
 * 直到模型给出最终回答或达到步数上限。
 *
 * 流式细节（Workers AI llama-3.3 实测）：
 * - 正文经 choices[].delta.content 逐段下发；
 * - 工具调用经 choices[].delta.tool_calls 分片下发，arguments 按下标累加拼接；
 * - finish_reason 为 'tool_calls' 时需要执行工具并续轮。
 *
 * 引用来源（sources）从 search_posts 的命中中累积，去重后持续回调，
 * 前端每次全量覆盖渲染（红线 2：引用必须可点验）。
 */

import { executeTool, toolSchemas, type SourceRef } from './tools';
import type { ChatEnv } from './types';

/** 工具循环最大步数（每步一次模型请求，可能执行多个工具） */
export const MAX_STEPS = 4;
/** 单步模型请求的超时（毫秒） */
export const STEP_TIMEOUT_MS = 20_000;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
}

export interface AgentCallbacks {
  /** 引用来源变化（全量覆盖语义） */
  onSources(sources: SourceRef[]): void;
  /** 正文增量 */
  onDelta(text: string): void;
  /** 一次工具调用（开始执行前回调，携带给前端展示的摘要） */
  onTool(step: number, name: string, args: Record<string, unknown>, summary: string): void;
}

interface PendingToolCall {
  id: string;
  name: string;
  arguments: string;
}

interface StepResult {
  content: string;
  toolCalls: PendingToolCall[];
}

export const AGENT_SYSTEM_PROMPT = `你是 Lumiracle 博客的站内问答助手，可以调用工具获取站内数据。

规则：
1. 涉及文章内容的问题，必须先调用 search_posts 检索。query 使用与文章标题、目录相近的关键词风格（如「暗色主题 图片 处理」），不要照抄口语问题。若检索结果未覆盖问题，先改写 query（换关键词、拆细主题）再检索一次，最多重试 2 次；确实无命中才说明「根据现有资料无法回答该问题」并指出缺少什么信息。
2. 涉及阅读数据、评论、文章清单的问题，分别调用 get_stats、list_comments、list_posts；不要凭空编造数字。
3. 只基于工具返回的数据回答，禁止推测、编造或使用资料之外的知识；即使你知道「常识答案」，也要以站内资料为准并引用，缺少资料支撑的部分必须明确说明。
4. 回答中凡涉及文章内容的句子，末尾必须标注来源，格式为 [来源: 文章标题 › 小节]；没有可引用的资料就不要给出该结论。
5. 与站内数据无关的闲聊，直接礼貌说明你只了解这个博客的内容。
6. 不要提及「工具」「调用」等字眼，直接作答。`;

/** 在时限内等待 promise，超时抛错。 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label}超时`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/** 解析 Workers AI 的 SSE 增量流：正文回调，tool_calls 按下标聚合后整体返回。 */
async function pumpStep(
  stream: ReadableStream<Uint8Array>,
  onDelta: (text: string) => void,
): Promise<StepResult> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  const calls = new Map<number, PendingToolCall>();

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const json = JSON.parse(payload) as {
          choices?: Array<{
            delta?: {
              content?: string;
              tool_calls?: Array<{
                index?: number;
                id?: string;
                function?: { name?: string; arguments?: string };
              }>;
            };
          }>;
        };
        const delta = json.choices?.[0]?.delta;
        if (delta?.content) {
          content += delta.content;
          onDelta(delta.content);
        }
        for (const tc of delta?.tool_calls ?? []) {
          const idx = tc.index ?? 0;
          const slot = calls.get(idx) ?? { id: '', name: '', arguments: '' };
          if (tc.id) slot.id = tc.id;
          if (tc.function?.name) slot.name += tc.function.name;
          if (tc.function?.arguments) slot.arguments += tc.function.arguments;
          calls.set(idx, slot);
        }
      } catch {
        // 忽略无法解析的帧（如心跳）
      }
    }
  }

  return { content, toolCalls: [...calls.values()].filter((c) => c.name) };
}

/**
 * 运行 Agent 循环直到给出最终回答。
 * 工具失败不中断循环（错误作为结果回填）；单步超时向上抛出由调用方转明确提示。
 */
export async function runAgent(
  env: ChatEnv,
  question: string,
  options: { slug?: string; model: string },
  cb: AgentCallbacks,
): Promise<void> {
  const systemPrompt = options.slug
    ? `${AGENT_SYSTEM_PROMPT}\n7. 用户当前正在阅读文章「${options.slug}」，涉及该文章内容的问题优先用 slug 参数在文内检索。`
    : AGENT_SYSTEM_PROMPT;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: question },
  ];

  const allSources = new Map<string, SourceRef>();
  const pushSources = (refs: SourceRef[]) => {
    for (const s of refs) allSources.set(`${s.slug}#${s.anchor}`, s);
    cb.onSources([...allSources.values()].sort((a, b) => b.score - a.score));
  };

  for (let step = 1; step <= MAX_STEPS; step += 1) {
    const aiOut = await withTimeout(
      env.AI.run(options.model, {
        messages,
        tools: toolSchemas(),
        max_tokens: 1024,
        stream: true,
      }),
      STEP_TIMEOUT_MS,
      '模型响应',
    );
    if (!(aiOut instanceof ReadableStream)) {
      throw new Error('模型未返回流式结果');
    }

    const { content, toolCalls } = await pumpStep(aiOut, cb.onDelta);

    if (!toolCalls.length) {
      return; // 模型给出最终回答
    }

    // 回填 assistant(tool_calls) 消息，逐个执行工具
    messages.push({
      role: 'assistant',
      content: content || '',
      tool_calls: toolCalls.map((c) => ({
        id: c.id || `call_${step}_${c.name}`,
        type: 'function',
        function: { name: c.name, arguments: c.arguments || '{}' },
      })),
    });

    for (const call of toolCalls) {
      const name = call.name;
      let args: Record<string, unknown> = {};
      try {
        args = call.arguments.trim() ? (JSON.parse(call.arguments) as Record<string, unknown>) : {};
      } catch {
        args = {}; // 参数损坏时以空参执行，让工具侧返回明确错误
      }

      const outcome = await executeTool(env, name, call.arguments || '{}');
      if (outcome.sources.length) pushSources(outcome.sources);
      cb.onTool(step, name, args, outcome.summary);

      messages.push({
        role: 'tool',
        content: outcome.content,
        tool_call_id: call.id || `call_${step}_${name}`,
      });
    }
  }

  // 达到步数上限：给出收束提示（理论上模型应在步数内完成）
  cb.onDelta('\n\n（已达到本次查询的工具调用上限，以上是基于已获取信息回答。）');
}
