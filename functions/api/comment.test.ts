import { describe, it, expect } from 'vitest';
import { onRequestGet, onRequestPost, onRequestDelete } from './comment';

/** 假 D1：all() 由 resolver 返回，run() 带 meta.last_row_id。 */
function fakeDB(resolver?: (sql: string) => { results?: unknown[] } | never) {
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
          if (!resolver) return { results: [] };
          return resolver(sql);
        },
        async run() {
          calls.push({ sql, params: stmt.params });
          return { success: true, meta: { last_row_id: 42 } };
        },
      };
      return stmt;
    },
  };
  return { db, calls };
}

const ctx = (url: string, env: Record<string, unknown>, init: RequestInit = {}) => ({
  env: env as never,
  request: new Request(url, init),
});

const jsonInit = (body: unknown, headers: Record<string, string> = {}): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

describe('comment GET', () => {
  it('缺少 slug 返回 400', async () => {
    const { db } = fakeDB();
    expect((await onRequestGet(ctx('http://localhost/api/comment', { DB: db }))).status).toBe(400);
    expect((await onRequestGet(ctx('http://localhost/api/comment?slug=', { DB: db }))).status).toBe(400);
  });

  it('slug 超长返回 400', async () => {
    const { db } = fakeDB();
    const long = 'x'.repeat(121);
    expect((await onRequestGet(ctx(`http://localhost/api/comment?slug=${long}`, { DB: db }))).status).toBe(400);
  });

  it('正常返回已发布评论', async () => {
    const { db, calls } = fakeDB(() => ({ results: [{ id: 1, author: '读者', content: '很棒', created_at: 1 }] }));
    const res = await onRequestGet(ctx('http://localhost/api/comment?slug=hello-world', { DB: db }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; comments: unknown[] };
    expect(body.ok).toBe(true);
    expect(body.comments).toHaveLength(1);
    expect(calls[0].sql).toContain("status = 'approved'");
    expect(calls[0].params[0]).toBe('hello-world');
  });

  it('DB 异常返回 500', async () => {
    const env = {
      DB: {
        prepare: () => ({
          bind: () => ({
            all: async () => {
              throw new Error('down');
            },
          }),
        }),
      },
    };
    expect((await onRequestGet(ctx('http://localhost/api/comment?slug=x', env))).status).toBe(500);
  });
});

describe('comment POST 校验', () => {
  const env = () => fakeDB().db;

  it('非 JSON 返回 400', async () => {
    expect((await onRequestPost(ctx('http://localhost/api/comment', { DB: env() }, jsonInit('nope')))).status).toBe(400);
  });

  it('缺 slug / 昵称 / 内容分别返回 400', async () => {
    const e = { DB: env() };
    expect((await onRequestPost(ctx('http://localhost/api/comment', e, jsonInit({ author: 'a', content: 'c' })))).status).toBe(400);
    expect((await onRequestPost(ctx('http://localhost/api/comment', e, jsonInit({ slug: 's', content: 'c' })))).status).toBe(400);
    expect((await onRequestPost(ctx('http://localhost/api/comment', e, jsonInit({ slug: 's', author: 'a' })))).status).toBe(400);
  });

  it('昵称超 32 字 / 内容超 500 字返回 400', async () => {
    const e = { DB: env() };
    expect(
      (await onRequestPost(ctx('http://localhost/api/comment', e, jsonInit({ slug: 's', author: 'x'.repeat(33), content: 'c' })))).status,
    ).toBe(400);
    expect(
      (await onRequestPost(ctx('http://localhost/api/comment', e, jsonInit({ slug: 's', author: 'a', content: 'x'.repeat(501) })))).status,
    ).toBe(400);
  });

  it('合法评论写入并以 last_row_id 返回', async () => {
    const { db, calls } = fakeDB();
    const res = await onRequestPost(ctx('http://localhost/api/comment', { DB: db }, jsonInit({ slug: 'hello-world', author: '小明', content: '写得好' })));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; comment: { id: number; author: string } };
    expect(body.comment.id).toBe(42);
    expect(body.comment.author).toBe('小明');
    expect(calls[0].sql).toContain('INSERT INTO comments');
  });

  it('DB 异常返回 500', async () => {
    const e = {
      DB: {
        prepare: () => ({
          bind: () => ({
            run: async () => {
              throw new Error('down');
            },
          }),
        }),
      },
    };
    expect((await onRequestPost(ctx('http://localhost/api/comment', e, jsonInit({ slug: 's', author: 'a', content: 'c' })))).status).toBe(500);
  });
});

describe('comment DELETE 鉴权与校验', () => {
  const init = (token?: string) => ({
    method: 'DELETE',
    headers: token ? { 'x-admin-token': token } : {},
  });

  it('未配置令牌时一律 403', async () => {
    const { db } = fakeDB();
    const res = await onRequestDelete(ctx('http://localhost/api/comment?id=1', { DB: db }, init('any')));
    expect(res.status).toBe(403);
  });

  it('令牌不匹配返回 403', async () => {
    const { db } = fakeDB();
    const res = await onRequestDelete(ctx('http://localhost/api/comment?id=1', { DB: db, ADMIN_TOKEN: 'secret' }, init('wrong')));
    expect(res.status).toBe(403);
  });

  it('令牌正确但 id 非法返回 400', async () => {
    const { db } = fakeDB();
    const env = { DB: db, ADMIN_TOKEN: 'secret' };
    expect((await onRequestDelete(ctx('http://localhost/api/comment', env, init('secret')))).status).toBe(400);
    expect((await onRequestDelete(ctx('http://localhost/api/comment?id=-1', env, init('secret')))).status).toBe(400);
    expect((await onRequestDelete(ctx('http://localhost/api/comment?id=abc', env, init('secret')))).status).toBe(400);
  });

  it('令牌正确且 id 合法时删除成功', async () => {
    const { db, calls } = fakeDB();
    const res = await onRequestDelete(ctx('http://localhost/api/comment?id=7', { DB: db, ADMIN_TOKEN: 'secret' }, init('secret')));
    expect(res.status).toBe(200);
    expect(calls[0].sql).toContain('DELETE FROM comments');
    expect(calls[0].params[0]).toBe(7);
  });
});
