import { describe, it, expect, vi } from 'vitest';
import { TOOLS, toolSchemas, executeTool } from './tools';
import type { ChatEnv } from './types';

const names = TOOLS.map((t) => t.name);

function makeEnv(over: Partial<ChatEnv> & { commentResults?: unknown[]; vectorizeMatches?: unknown[] } = {}) {
  return {
    AI: { run: vi.fn(async () => ({ data: [[0.1]] })) } as never,
    VECTORIZE: {
      query: vi.fn(async () => ({
        matches:
          over.vectorizeMatches ?? [
            {
              id: 'demo#intro',
              score: 0.9,
              metadata: { slug: 'demo', title: '示例', anchor: 'intro', heading: '', text: '正文内容。' },
            },
          ],
      })),
    } as never,
    DB: {
      prepare: vi.fn(() => ({
        bind: () => ({
          all: async <T>() => ({ results: (over.commentResults ?? []) as T[] }),
          run: async () => ({}),
        }),
        all: async <T>() => ({ results: (over.commentResults ?? []) as T[] }),
      })),
    } as never,
    ...over,
  } as ChatEnv & { DB: { prepare: ReturnType<typeof vi.fn> }; VECTORIZE: { query: ReturnType<typeof vi.fn> } };
}

describe('工具注册表', () => {
  it('包含四个工具且 schema 符合 OpenAI tools 格式', () => {
    expect(names).toEqual(['search_posts', 'get_stats', 'list_comments', 'list_posts']);
    const schemas = toolSchemas();
    for (const s of schemas) {
      expect(s.type).toBe('function');
      expect(s.function.name).toBeTruthy();
      expect(s.function.description.length).toBeGreaterThan(5);
      expect(s.function.parameters).toHaveProperty('properties');
    }
  });
});

describe('search_posts', () => {
  it('返回命中块与可点验引用来源', async () => {
    const env = makeEnv();
    const out = await executeTool(env, 'search_posts', JSON.stringify({ query: '什么是静态导出' }));
    const parsed = JSON.parse(out.content) as { hits: number; matches: Array<{ slug: string }> };
    expect(parsed.hits).toBe(1);
    expect(parsed.matches[0].slug).toBe('demo');
    expect(out.sources[0]).toMatchObject({ slug: 'demo', anchor: 'intro' });
    expect(out.summary).toContain('语义检索');
  });

  it('缺少 query 时以错误结果交回模型而非抛出', async () => {
    const env = makeEnv();
    const out = await executeTool(env, 'search_posts', '{}');
    const parsed = JSON.parse(out.content) as { error?: string };
    expect(parsed.error).toContain('query');
    expect(out.summary).toContain('失败');
  });
});

describe('get_stats', () => {
  it('聚合结果裁剪为 topArticles/topReferrers', async () => {
    const env = makeEnv();
    // 让 collectStats 的四条查询都返回可控行
    (env.DB.prepare as ReturnType<typeof vi.fn>).mockImplementation((sql: string) => {
      const rows = sql.includes('article_slug AS slug')
        ? [{ slug: 'a', pv: 5, uv: 3 }, { slug: 'b', pv: 2, uv: 2 }]
        : sql.includes('referrer')
          ? [{ source: 'direct', pv: 7, uv: 4 }]
          : sql.includes('COUNT(*) AS pv')
            ? [{ pv: 7, uv: 4 }]
            : [];
      return {
        bind: () => ({ all: async <T>() => ({ results: rows as T[] }), run: async () => ({}) }),
        all: async <T>() => ({ results: rows as T[] }),
      };
    });
    const out = await executeTool(env, 'get_stats', JSON.stringify({ days: 3 }));
    const parsed = JSON.parse(out.content) as {
      totals: { pv: number };
      topArticles: Array<{ slug: string }>;
      range: { days: number };
    };
    expect(parsed.totals.pv).toBe(7);
    expect(parsed.topArticles).toHaveLength(2);
    expect(parsed.range.days).toBe(3);
    expect(out.summary).toContain('阅读统计');
  });
});

describe('list_comments', () => {
  it('不带 slug 查全站，返回裁剪后的评论', async () => {
    const env = makeEnv({
      commentResults: [{ id: 1, article_slug: 'demo', author: '阿明', content: 'x'.repeat(120), created_at: 1_700_000_000 }],
    });
    const out = await executeTool(env, 'list_comments', '{}');
    const parsed = JSON.parse(out.content) as { count: number; comments: Array<{ content: string; time: string }> };
    expect(parsed.count).toBe(1);
    expect(parsed.comments[0].content.endsWith('…')).toBe(true);
    expect(parsed.comments[0].time).toBe('2023-11-14');
    expect(out.summary).toContain('读取评论');
  });

  it('带 slug 时把 slug 绑定进查询', async () => {
    const env = makeEnv();
    const boundArgs: unknown[][] = [];
    (env.DB.prepare as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      bind: (...vals: unknown[]) => {
        boundArgs.push(vals);
        return {
          all: async <T>() => ({ results: (env.commentResults ?? []) as T[] }),
          run: async () => ({}),
        };
      },
      all: async <T>() => ({ results: (env.commentResults ?? []) as T[] }),
    }));
    await executeTool(env, 'list_comments', JSON.stringify({ slug: 'demo-slug' }));
    expect(boundArgs[0]).toEqual(['demo-slug', 10]);
  });
});

describe('list_posts', () => {
  it('返回构建期生成的全部文章元数据', async () => {
    const out = await executeTool(makeEnv(), 'list_posts', '{}');
    const parsed = JSON.parse(out.content) as { count: number; posts: Array<{ slug: string; title: string }> };
    expect(parsed.count).toBeGreaterThan(0);
    expect(parsed.posts[0]).toHaveProperty('slug');
    expect(parsed.posts[0]).toHaveProperty('description');
  });
});

describe('executeTool 防御', () => {
  it('未知工具抛出', async () => {
    await expect(executeTool(makeEnv(), 'no_such_tool', '{}')).rejects.toThrow('未知工具');
  });

  it('坏 JSON 参数以错误结果交回模型', async () => {
    const env = makeEnv();
    const out = await executeTool(env, 'list_comments', '{broken');
    expect((JSON.parse(out.content) as { error?: string }).error).toContain('JSON');
  });
});
