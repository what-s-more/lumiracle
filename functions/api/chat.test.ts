import { describe, it, expect, vi } from 'vitest';
import { onRequestPost } from './chat';
import type { VectorizeMatch } from '../lib/types';

type Frame =
  | { type: 'sources'; sources: Array<{ slug: string; title: string; anchor: string; heading: string }> }
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

/** 构造模拟 Workers AI 流式输出的 ReadableStream。 */
function aiStream(pieces: string[]): ReadableStream<Uint8Array> {
  const body = pieces.map((p) => `data: ${JSON.stringify({ choices: [{ delta: { content: p } }] })}\n\n`).join('');
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(body));
      controller.close();
    },
  });
}

const match = (over: Partial<VectorizeMatch> = {}): VectorizeMatch => ({
  id: 'hello-world#intro',
  score: 0.8,
  metadata: { slug: 'hello-world', title: 'Hello World', anchor: 'intro', heading: '导语', text: 'GD 通过此信息进行通信。' },
  ...over,
});

/** 假环境：embedding 返回固定向量，生成返回可控流；可注入抛错。 */
function makeEnv(matches: VectorizeMatch[], opts: { failEmbed?: boolean; nonStream?: boolean } = {}) {
  const AI = {
    run: vi.fn(async (model: string) => {
      if (model === '@cf/baai/bge-m3') {
        if (opts.failEmbed) throw new Error('embedding 服务不可用');
        return { data: [[0.1, 0.2]] };
      }
      if (opts.nonStream) return { response: 'not a stream' };
      return aiStream(['你好', '，世界']);
    }),
  };
  return { AI: AI as never, VECTORIZE: { query: vi.fn(async () => ({ matches })) as never } };
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
    const res = await post('nope', makeEnv([]));
    expect(res.status).toBe(400);
  });

  it('缺少 question 返回 400', async () => {
    const res = await post({}, makeEnv([]));
    expect(res.status).toBe(400);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('question 超过 500 字返回 400', async () => {
    const res = await post({ question: 'x'.repeat(501) }, makeEnv([]));
    expect(res.status).toBe(400);
  });
});

describe('chat 流式响应', () => {
  it('有命中时先发 sources 再逐段 delta，最后 done', async () => {
    const res = await post({ question: 'GD 是什么？' }, makeEnv([match()]));
    expect(res.headers.get('Content-Type')).toContain('text/event-stream');
    const frames = await readSse(res);
    expect(frames[0]).toMatchObject({ type: 'sources' });
    expect((frames[0] as { sources: unknown[] }).sources).toHaveLength(1);
    expect((frames[0] as { sources: Array<{ slug: string; anchor: string }> }).sources[0]).toMatchObject({
      slug: 'hello-world',
      anchor: 'intro',
    });
    const text = frames.filter((f) => f.type === 'delta').map((f) => (f as { text: string }).text).join('');
    expect(text).toBe('你好，世界');
    expect(frames.at(-1)).toEqual({ type: 'done' });
  });

  it('无命中时返回拒答文案且 sources 为空', async () => {
    const res = await post({ question: '无关问题' }, makeEnv([]));
    const frames = await readSse(res);
    const sources = frames.find((f) => f.type === 'sources') as { sources: unknown[] };
    expect(sources.sources).toEqual([]);
    const text = frames.filter((f) => f.type === 'delta').map((f) => (f as { text: string }).text).join('');
    expect(text).toContain('无法回答');
    expect(frames.at(-1)).toEqual({ type: 'done' });
  });

  it('embedding 失败时返回检索不可用提示', async () => {
    const res = await post({ question: '问题' }, makeEnv([match()], { failEmbed: true }));
    const frames = await readSse(res);
    const err = frames.find((f) => f.type === 'error') as { message: string };
    expect(err.message).toContain('检索服务暂时不可用');
    expect(frames.at(-1)).toEqual({ type: 'error', message: err.message });
  });

  it('模型未返回流时给出明确提示', async () => {
    const res = await post({ question: '问题' }, makeEnv([match()], { nonStream: true }));
    const frames = await readSse(res);
    const err = frames.find((f) => f.type === 'error') as { message: string };
    expect(err.message).toContain('未返回流式结果');
  });
});
