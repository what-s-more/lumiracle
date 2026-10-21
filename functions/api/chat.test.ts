import { describe, it, expect, vi } from 'vitest';
import { onRequestPost } from './chat';
import type { VectorizeMatch } from '../lib/types';

type Frame =
  | { type: 'sources'; sources: Array<{ slug: string; title: string; anchor: string; heading: string }> }
  | { type: 'tool'; step: number; name: string; args: Record<string, unknown>; summary: string }
  | { type: 'delta'; text: string }
  | { type: 'error'; message: string }
  | { type: 'done' };

/** 把 SSE 响应体解析为帧数组。 */
async function readSse(res: Response): Promise<Frame[]> {
  const text = await res.text();
  return text
    .split('\n\n')
    .map((block) => block.trim())
    .filter((block) => block.startsWith('data:'))
    .map((block) => JSON.parse(block.slice(5).trim()) as Frame);
}

/** 构造纯正文流。 */
function aiTextStream(pieces: string[]): ReadableStream<Uint8Array> {
  const body = pieces.map((p) => `data: ${JSON.stringify({ choices: [{ delta: { content: p } }] })}\n\n`).join('');
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(body));
      controller.close();
    },
  });
}

/** 构造 tool_calls 流：name 一帧 + arguments 分两帧下发，模拟真实分片。 */
function aiToolCallStream(id: string, name: string, args: string): ReadableStream<Uint8Array> {
  const mid = Math.max(1, Math.ceil(args.length / 2));
  const frames = [
    { choices: [{ delta: { tool_calls: [{ index: 0, id, function: { name } }] } }] },
    { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: args.slice(0, mid) } }] } }] },
    { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: args.slice(mid) } }] } }] },
  ];
  const body = frames.map((f) => `data: ${JSON.stringify(f)}\n\n`).join('');
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(body));
      controller.close();
    },
  });
}

const match = (over: Partial<VectorizeMatch> = {}): VectorizeMatch => ({
  id: 'demo-slug#intro',
  score: 0.8,
  metadata: { slug: 'demo-slug', title: '示例文章', anchor: 'intro', heading: '导语', text: '示例正文段落。' },
  ...over,
});

interface EnvOptions {
  matches?: VectorizeMatch[];
  failVectorize?: boolean;
  nonStream?: boolean;
  aiThrow?: boolean;
  commentRows?: Array<Record<string, unknown>>;
  /** 按调用次序回放的 AI 输出流（缺省走内置默认脚本） */
  scripted?: ReadableStream<Uint8Array>[];
}

/** 假环境：AI 生成按调用次数返回预设脚本；Vectorize/D1 可注入行为。 */
function makeEnv(opts: EnvOptions = {}) {
  const scripted: ReadableStream<Uint8Array>[] = opts.scripted ?? [];
  let call = 0;
  const AI = {
    run: vi.fn(async (model: string, input: { messages?: unknown[] }) => {
      if (opts.aiThrow) throw new Error('模型服务不可用');
      if (opts.nonStream) return { response: 'not a stream' };
      // embedding 模型：返回固定向量（search_posts 工具内部使用）
      if (model === '@cf/baai/bge-m3') return { data: [[0.1, 0.2]] };
      const messages = (input.messages ?? []) as Array<{ role: string }>;
      const next = scripted[call];
      call += 1;
      if (next) return next;
      // 默认脚本：首轮出现 tool 消息则给正文，否则调 search_posts
      if (messages.some((m) => m.role === 'tool')) return aiTextStream(['最终', '回答']);
      return aiToolCallStream('call_1', 'search_posts', JSON.stringify({ query: '测试问题' }));
    }),
  };
  const DB = {
    prepare: vi.fn(() => ({
      bind: () => ({
        all: async <T>() => ({ results: (opts.commentRows ?? []) as T[] }),
        run: async () => ({}),
      }),
      all: async <T>() => ({ results: (opts.commentRows ?? []) as T[] }),
    })),
  };
  const VECTORIZE = {
    query: opts.failVectorize
      ? vi.fn(async () => { throw new Error('索引不可用'); })
      : vi.fn(async () => ({ matches: opts.matches ?? [] })),
  };
  return { AI, DB, VECTORIZE };
}

const post = (body: unknown, env: Record<string, unknown>) =>
  onRequestPost({
    env: env as never,
    request: new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  });

describe('chat 入参校验', () => {
  it('非 JSON 请求体返回 400', async () => {
    const res = await post('nope', makeEnv());
    expect(res.status).toBe(400);
  });

  it('缺少 question 返回 400', async () => {
    const res = await post({}, makeEnv());
    expect(res.status).toBe(400);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('question 超过 500 字返回 400', async () => {
    const res = await post({ question: 'x'.repeat(501) }, makeEnv());
    expect(res.status).toBe(400);
  });
});

describe('chat Agent 流', () => {
  it('模型直接回答：delta + done，无 sources 无 tool 帧', async () => {
    const env = makeEnv();
    (env.AI.run as ReturnType<typeof vi.fn>).mockImplementation(async () => aiTextStream(['你好', '，世界']));
    const res = await post({ question: '你是谁？' }, env);
    expect(res.headers.get('Content-Type')).toContain('text/event-stream');
    const frames = await readSse(res);
    expect(frames.filter((f) => f.type === 'tool')).toHaveLength(0);
    expect(frames.filter((f) => f.type === 'sources')).toHaveLength(0);
    const text = frames.filter((f) => f.type === 'delta').map((f) => (f as { text: string }).text).join('');
    expect(text).toBe('你好，世界');
    expect(frames.at(-1)).toEqual({ type: 'done' });
  });

  it('调用 search_posts：tool 帧 + sources 帧 + 第二轮正文', async () => {
    const env = makeEnv({ matches: [match()] });
    const res = await post({ question: '示例正文说了什么？' }, env);
    const frames = await readSse(res);

    const toolFrames = frames.filter((f) => f.type === 'tool') as Array<{ name: string; args: Record<string, unknown>; summary: string }>;
    expect(toolFrames).toHaveLength(1);
    expect(toolFrames[0]).toMatchObject({ name: 'search_posts', args: { query: '测试问题' } });

    const srcFrames = frames.filter((f) => f.type === 'sources') as Array<{ sources: Array<{ slug: string; anchor: string }> }>;
    expect(srcFrames.length).toBeGreaterThan(0);
    expect(srcFrames.at(-1)!.sources[0]).toMatchObject({ slug: 'demo-slug', anchor: 'intro' });

    const text = frames.filter((f) => f.type === 'delta').map((f) => (f as { text: string }).text).join('');
    expect(text).toBe('最终回答');
    expect(frames.at(-1)).toEqual({ type: 'done' });
  });

  it('arguments 分片累积正确还原完整 JSON', async () => {
    const env = makeEnv();
    (env.AI.run as ReturnType<typeof vi.fn>).mockImplementationOnce(async () =>
      aiToolCallStream('call_x', 'list_comments', JSON.stringify({ slug: 'demo-slug', limit: 5 })),
    );
    const res = await post({ question: '这篇文章的评论' }, env);
    const frames = await readSse(res);
    const toolFrame = frames.find((f) => f.type === 'tool') as { name: string; args: Record<string, unknown> };
    expect(toolFrame.args).toEqual({ slug: 'demo-slug', limit: 5 });
  });

  it('工具失败不中断：错误回填模型后仍正常收尾', async () => {
    const env = makeEnv({ failVectorize: true });
    const res = await post({ question: '问题' }, env);
    const frames = await readSse(res);
    const toolFrames = frames.filter((f) => f.type === 'tool');
    expect(toolFrames).toHaveLength(1);
    const text = frames.filter((f) => f.type === 'delta').map((f) => (f as { text: string }).text).join('');
    expect(text).toBe('最终回答');
    expect(frames.at(-1)).toEqual({ type: 'done' });
  });

  it('模型未返回流时给出明确提示', async () => {
    const env = makeEnv({ nonStream: true });
    const res = await post({ question: '问题' }, env);
    const frames = await readSse(res);
    const err = frames.find((f) => f.type === 'error') as { message: string };
    expect(err.message).toContain('未返回流式结果');
  });

  it('模型服务抛错时返回 error 帧', async () => {
    const env = makeEnv({ aiThrow: true });
    const res = await post({ question: '问题' }, env);
    const frames = await readSse(res);
    const err = frames.find((f) => f.type === 'error') as { message: string };
    expect(err.message).toContain('生成失败');
    expect(frames.at(-1)).toMatchObject({ type: 'error' });
  });
});
