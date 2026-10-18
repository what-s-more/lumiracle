/**
 * RAG 问答接口（T2 / M1-B）
 *
 * POST /api/chat  { question: string, slug?: string }
 * 返回 SSE 流：首帧 sources（可点验的引用来源）→ 若干 delta 正文 → done。
 * 无命中 / embedding 失败 / 模型超时均返回明确提示，不做空输出。
 *
 * 生成模型默认 @cf/meta/llama-3.3-70b-instruct-fp8-fast（中文表现与延迟均优于 8b），
 * 可用 Pages 环境变量 CHAT_MODEL 覆盖。
 */

import { retrieve, type RetrievedChunk } from '../lib/retrieve';
import { buildMessages, NO_MATCH_REPLY } from '../lib/prompt';
import type { ChatEnv } from '../lib/types';

const DEFAULT_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
/** 检索 + 生成的整体时限（毫秒） */
const TIMEOUT_MS = 25_000;
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
  | { type: 'sources'; sources: Array<Pick<RetrievedChunk, 'slug' | 'title' | 'anchor' | 'heading' | 'score'>> }
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

/** 解析 Workers AI 的 SSE 增量流，逐段提取正文并回调。 */
async function pumpAiStream(
  stream: ReadableStream<Uint8Array>,
  onDelta: (text: string) => void,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
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
          choices?: Array<{ delta?: { content?: string } }>;
          response?: string;
        };
        const text = json.choices?.[0]?.delta?.content ?? json.response ?? '';
        if (text) onDelta(text);
      } catch {
        // 忽略无法解析的帧（如心跳）
      }
    }
  }
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
  const model = context.env.CHAT_MODEL || DEFAULT_MODEL;

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
      const fail = (message: string) => {
        send({ type: 'error', message });
        finish();
      };

      try {
        let chunks: RetrievedChunk[] = [];
        try {
          chunks = await withTimeout(retrieve(context.env, question, { slug }), TIMEOUT_MS, '检索');
        } catch (err) {
          fail(`检索服务暂时不可用（${(err as Error).message}），请稍后重试。`);
          return;
        }

        send({
          type: 'sources',
          sources: chunks.map(({ slug: s, title, anchor, heading, score }) => ({ slug: s, title, anchor, heading, score })),
        });

        if (!chunks.length) {
          send({ type: 'delta', text: NO_MATCH_REPLY });
          send({ type: 'done' });
          finish();
          return;
        }

        const aiOut = await withTimeout(
          context.env.AI.run(model, {
            messages: buildMessages(question, chunks),
            max_tokens: 1024,
            stream: true,
          }),
          TIMEOUT_MS,
          '模型响应',
        );

        if (!(aiOut instanceof ReadableStream)) {
          fail('模型未返回流式结果，请稍后重试。');
          return;
        }

        await pumpAiStream(aiOut, (text) => send({ type: 'delta', text }));
        send({ type: 'done' });
        finish();
      } catch (err) {
        fail(`生成失败（${(err as Error).message}），请稍后重试。`);
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
