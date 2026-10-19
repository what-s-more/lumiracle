import { describe, it, expect, vi } from 'vitest';
import { onRequestGet, onRequestPost } from './stats';

/** 记录 SQL 的假 D1：all() 由 resolver 按 SQL 返回结果，run() 返回固定 meta。 */
function fakeDB(resolver?: (sql: string) => { results?: unknown[] }) {
  const calls: { sql: string; params: unknown[] }[] = [];
  const db = {
    prepare(sql: string) {
      const stmt = {
        params: [] as unknown[],
        bind(...values: unknown[]) {
          stmt.params = values;
          return stmt;
        },
        async all() {
          calls.push({ sql, params: stmt.params });
          return resolver ? resolver(sql) : { results: [] };
        },
        async run() {
          calls.push({ sql, params: stmt.params });
          return { success: true, meta: { last_row_id: 1 } };
        },
      };
      return stmt;
    },
  };
  return { db, calls };
}

const post = (body: unknown, env: Record<string, unknown>, headers: Record<string, string> = {}) =>
  onRequestPost({
    env: env as never,
    request: new Request('http://localhost/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  });

describe('stats POST 校验', () => {
  it('非 JSON 请求体返回 400', async () => {
    const { db } = fakeDB();
    const res = await post('not-json', { DB: db });
    expect(res.status).toBe(400);
  });

  it('path 缺失或非站内路径返回 400', async () => {
    const { db } = fakeDB();
    expect((await post({}, { DB: db })).status).toBe(400);
    expect((await post({ path: 'http://evil.com' }, { DB: db })).status).toBe(400);
    expect((await post({ path: 'about' }, { DB: db })).status).toBe(400);
  });

  it('合法入参写入事件并返回 204', async () => {
    const { db, calls } = fakeDB();
    const res = await post({ path: '/posts/hello-world/', articleSlug: 'hello-world', referrer: 'https://x' }, { DB: db });
    expect(res.status).toBe(204);
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain('INSERT INTO events');
    // 落库参数：path / slug / referrer / ua_hash / ts
    expect(calls[0].params[0]).toBe('/posts/hello-world/');
    expect(calls[0].params[1]).toBe('hello-world');
    expect(calls[0].params[2]).toBe('https://x');
    expect(typeof calls[0].params[3]).toBe('string');
    expect(calls[0].params[3]).toHaveLength(32);
  });

  it('articleSlug 与 referrer 为空时落库为 null', async () => {
    const { db, calls } = fakeDB();
    await post({ path: '/', articleSlug: '', referrer: '' }, { DB: db });
    expect(calls[0].params[1]).toBeNull();
    expect(calls[0].params[2]).toBeNull();
  });

  it('UA 缺省时用 unknown 参与哈希（仍返回 204）', async () => {
    const { db } = fakeDB();
    const res = await post({ path: '/' }, { DB: db });
    expect(res.status).toBe(204);
  });

  it('DB 写入失败仍返回 204（埋点不阻塞阅读）', async () => {
    const env = {
      DB: {
        prepare: () => ({ bind: () => ({ run: async () => { throw new Error('db down'); } }) }),
      },
    };
    const res = await post({ path: '/' }, env);
    expect(res.status).toBe(204);
  });
});

const get = (query: string, env: Record<string, unknown>) =>
  onRequestGet({ env: env as never, request: new Request(`http://localhost/api/stats${query}`) });

describe('stats GET 聚合', () => {
  // recentDays() 以 UTC 日期为基准生成日期序列，测试数据须用同一基准，否则跨时区必挂
  const todayStr = new Date().toISOString().slice(0, 10);
  const resolver = (sql: string) => {
    if (sql.includes('COUNT(*) AS pv, COUNT(DISTINCT ua_hash) AS uv FROM events WHERE ts')) {
      return { results: [{ pv: 10, uv: 4 }] };
    }
    if (sql.includes("date(ts, 'unixepoch')")) {
      return { results: [{ day: todayStr, pv: 3, uv: 2 }] };
    }
    if (sql.includes('COALESCE')) {
      return { results: [{ source: 'direct', pv: 6, uv: 3 }] };
    }
    return { results: [{ slug: 'hello-world', pv: 5, uv: 2 }] };
  };

  it('返回 totals / daily / referrers / articles，并按天数补零', async () => {
    const { db } = fakeDB(resolver);
    const res = await get('?days=3', { DB: db });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      range: { days: number };
      totals: { pv: number; uv: number };
      daily: Array<{ day: string; pv: number }>;
      referrers: Array<{ source: string }>;
      articles: Array<{ slug: string }>;
    };
    expect(body.ok).toBe(true);
    expect(body.range.days).toBe(3);
    expect(body.totals).toEqual({ pv: 10, uv: 4 });
    expect(body.daily).toHaveLength(3); // 补零到 3 天
    expect(body.daily.at(-1)).toEqual({ day: todayStr, pv: 3, uv: 2 });
    expect(body.referrers[0].source).toBe('direct');
    expect(body.articles[0].slug).toBe('hello-world');
  });

  it('days 非法或越界时回退/夹取', async () => {
    const { db } = fakeDB(resolver);
    expect(((await (await get('', { DB: db })).json()) as { range: { days: number } }).range.days).toBe(7);
    expect(((await (await get('?days=9999', { DB: db })).json()) as { range: { days: number } }).range.days).toBe(90);
    expect(((await (await get('?days=0', { DB: db })).json()) as { range: { days: number } }).range.days).toBe(1);
  });

  it('聚合异常返回 500', async () => {
    const env = {
      DB: {
        prepare: () => ({
          bind: () => ({
            all: vi.fn(async () => {
              throw new Error('boom');
            }),
          }),
        }),
      },
    };
    const res = await get('', env);
    expect(res.status).toBe(500);
    expect(((await res.json()) as { error: string }).error).toContain('聚合失败');
  });
});
