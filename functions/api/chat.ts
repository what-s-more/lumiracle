/**
 * RAG 问答接口（T2 / M1-B → M6 Agent 化）
 *
 * POST /api/chat  { question: string, slug?: string }
 * 返回 SSE 流：
 *   sources → 若干 tool（工具调用过程）→ delta 正文 → done
 *   sources 会在每次 search_posts 命中后全量刷新。
 *
 * 内部为 Agent 循环（functions/lib/agent.ts）：模型自主决定调用
 * search_posts / get_stats / list_comments / list_posts，多步推理后回答。
 * 生成模型默认 @cf/meta/llama-3.3-70b-instruct-fp8-fast，可用 CHAT_MODEL 覆盖。
 */

import { runAgent, AGENT_SYSTEM_PROMPT } from '../lib/agent';
import type { ChatEnv } from '../lib/types';

/** 单次提问最长字符数 */
const MAX_QUESTION_LENGTH = 500;

interface ChatRequest {
  question?: unknown;
  slug?: unknown;
}

interface ChatContext {
  env: ChatEnv;
  request: Request;
}

type SseFrame =
  | { type: 'sources'; sources: Array<{ slug: string; title: string; anchor: string; heading: string; score: number }> }
  | { type: 'tool'; step: number; name: string; args: Record<string, unknown>; summary: string }
  | { type: 'delta'; text: string }
  | { type: 'error'; message: string }
  | { type: 'done' };

const SSE_HEADERS: Record<string, string> = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-store',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};

function sse(obj: SseFrame): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);
}

export async function onRequestPost(context: ChatContext): Promise<Response> {
  let body: ChatRequest;
  try {
    body = (await context.request.json()) as ChatRequest;
  } catch {
    return Response.json({ error: '请求体必须是 JSON。' }, { status: 400 });
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) {
    return Response.json({ error: '缺少 question 字段。' }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return Response.json({ error: `提问过长，请控制在 ${MAX_QUESTION_LENGTH} 字以内。` }, { status: 400 });
  }

  const slug = typeof body.slug === 'string' && body.slug.trim() ? body.slug.trim() : undefined;
  const model = context.env.CHAT_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (frame: SseFrame) => {
        if (!closed) controller.enqueue(sse(frame));
      };
      const finish = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // 已关闭
        }
      };

      try {
        await runAgent(
          context.env,
          question,
          { slug, model },
          {
            onSources(sources) {
              if (sources.length) send({ type: 'sources', sources });
            },
            onTool(step, name, args, summary) {
              send({ type: 'tool', step, name, args, summary });
            },
            onDelta(text) {
              send({ type: 'delta', text });
            },
          },
        );
        send({ type: 'done' });
        finish();
      } catch (err) {
        send({ type: 'error', message: `生成失败（${(err as Error).message}），请稍后重试。` });
        finish();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

export { AGENT_SYSTEM_PROMPT };
