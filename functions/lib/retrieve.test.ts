import { describe, it, expect, vi } from 'vitest';
import { retrieve, embedQuestion, EMBED_MODEL, TOP_K } from './retrieve';
import type { ChatEnv, VectorizeMatch } from './types';

/** 构造带可控 AI 与 Vectorize 的假环境，记录调用参数以便断言。 */
function makeEnv(
  matches: VectorizeMatch[],
  overrides: { embedding?: unknown; query?: (v: number[], o: unknown) => Promise<unknown> } = {},
) {
  const query = vi.fn(
    overrides.query ??
      (async () => ({ matches, count: matches.length })),
  );
  const env: ChatEnv = {
    AI: {
      run: vi.fn(async () =>
        'embedding' in overrides ? overrides.embedding : { data: [[0.1, 0.2, 0.3]] },
      ),
    },
    VECTORIZE: { query: query as unknown as ChatEnv['VECTORIZE']['query'] },
  };
  return { env, query };
}

const hit = (over: Partial<VectorizeMatch> = {}): VectorizeMatch => ({
  id: 'hello-world#intro',
  score: 0.8,
  metadata: { slug: 'hello-world', title: 'Hello World', anchor: 'intro', heading: '导语', text: '正文内容' },
  ...over,
});

describe('embedQuestion', () => {
  it('正常返回向量并调用 bge-m3', async () => {
    const { env } = makeEnv([]);
    const vector = await embedQuestion(env, '问题');
    expect(vector).toEqual([0.1, 0.2, 0.3]);
    expect(env.AI.run).toHaveBeenCalledWith(EMBED_MODEL, { text: ['问题'] });
  });

  it('返回结构异常时抛错', async () => {
    const { env } = makeEnv([], { embedding: { data: 'oops' } });
    await expect(embedQuestion(env, 'x')).rejects.toThrow('embedding 返回结构异常');
  });

  it('返回空向量时抛错', async () => {
    const { env } = makeEnv([], { embedding: { data: [[]] } });
    await expect(embedQuestion(env, 'x')).rejects.toThrow('空向量');
  });
});

describe('retrieve', () => {
  it('按 score 降序返回并填充缺省 metadata', async () => {
    const { env } = makeEnv([
      hit({ id: 'a', score: 0.3 }),
      hit({ id: 'b', score: 0.95, metadata: { slug: 'b', text: 'B 正文' } }),
    ]);
    const chunks = await retrieve(env, '问题');
    expect(chunks.map((c) => c.id)).toEqual(['b', 'a']);
    expect(chunks[0].title).toBe('b'); // 无 title 时回退 slug
    expect(chunks[0].anchor).toBe('top'); // 无 anchor 时回退 top
  });

  it('过滤缺 slug 或缺正文的命中', async () => {
    const { env } = makeEnv([
      hit(),
      hit({ id: 'no-slug', metadata: { text: '有正文无 slug' } }),
      hit({ id: 'no-text', metadata: { slug: 'x', title: 'X' } }),
    ]);
    const chunks = await retrieve(env, '问题');
    expect(chunks.map((c) => c.id)).toEqual(['hello-world#intro']);
  });

  it('无命中时返回空数组', async () => {
    const { env } = makeEnv([]);
    expect(await retrieve(env, '问题')).toEqual([]);
  });

  it('传入 slug 时先做限定检索，有命中则不再全站回退', async () => {
    const { env, query } = makeEnv([hit()]);
    await retrieve(env, '问题', { slug: 'hello-world' });
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][1]).toMatchObject({ filter: { slug: { $eq: 'hello-world' } } });
  });

  it('限定检索无命中时回退全站检索', async () => {
    const calls: unknown[] = [];
    const { env, query } = makeEnv([], {
      query: async (_v, o) => {
        calls.push(o);
        return calls.length === 1 ? { matches: [] } : { matches: [hit()] };
      },
    });
    const chunks = await retrieve(env, '问题', { slug: 'other' });
    expect(query).toHaveBeenCalledTimes(2);
    expect(chunks).toHaveLength(1);
  });

  it('使用自定义 topK 与默认 TOP_K', async () => {
    const { env, query } = makeEnv([hit()]);
    await retrieve(env, '问题', { topK: 2 });
    expect(query.mock.calls[0][1]).toMatchObject({ topK: 2, returnMetadata: 'all', returnValues: false });
    await retrieve(env, '问题');
    expect(query.mock.calls[1][1]).toMatchObject({ topK: TOP_K });
  });
});
