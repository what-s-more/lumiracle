/**
 * 文章评论接口（T6 / M4）
 *
 * GET    /api/comment?slug=<slug>   读取该文章已发布（approved）评论，按时间倒序
 * POST   /api/comment               提交评论 { slug, author, content }
 * DELETE /api/comment?id=<id>       管理端删除（需请求头 x-admin-token 匹配 Pages secret ADMIN_TOKEN）
 *
 * 站点无登录体系，采用「先发布、后审核」：新评论默认 approved 立即可见，
 * 违规内容由管理者凭令牌删除。status 预留 pending / rejected 以便切换前置审核。
 * 未配置 ADMIN_TOKEN 时所有管理操作一律 403，避免误开放删除入口。
 *
 * 评论内容仅作纯文本存储与展示（React 默认转义），不解析 HTML/Markdown。
 */

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = unknown>(): Promise<{ results?: T[] }>;
  run(): Promise<unknown>;
}

interface D1Binding {
  prepare(query: string): D1PreparedStatement;
}

interface CommentEnv {
  DB: D1Binding;
  /** 管理端删除令牌（Pages secret） */
  ADMIN_TOKEN?: string;
}

interface CommentContext {
  env: CommentEnv;
  request: Request;
}

interface CommentRow {
  id: number;
  author: string;
  content: string;
  created_at: number;
}

/** 单篇最多返回条数与各字段长度上限（边界校验） */
const MAX_RETURN = 100;
const MAX_SLUG_LENGTH = 120;
const MAX_AUTHOR_LENGTH = 32;
const MAX_CONTENT_LENGTH = 500;

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** 管理端鉴权：令牌已配置且请求头匹配才放行。 */
function isAdmin(context: CommentContext): boolean {
  const expected = context.env.ADMIN_TOKEN;
  if (!expected) return false;
  return context.request.headers.get('x-admin-token') === expected;
}

export async function onRequestGet(context: CommentContext): Promise<Response> {
  const slug = (new URL(context.request.url).searchParams.get('slug') || '').trim();
  if (!slug || slug.length > MAX_SLUG_LENGTH) {
    return json({ error: '缺少有效的 slug。' }, 400);
  }

  try {
    const rows = await context.env.DB.prepare(
      `SELECT id, author, content, created_at
         FROM comments
        WHERE article_slug = ? AND status = 'approved'
        ORDER BY created_at DESC
        LIMIT ?`,
    )
      .bind(slug, MAX_RETURN)
      .all<CommentRow>();

    return json({ ok: true, comments: rows.results ?? [] });
  } catch (err) {
    return json({ error: `读取评论失败：${(err as Error).message}` }, 500);
  }
}

export async function onRequestPost(context: CommentContext): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: '请求体必须是 JSON。' }, 400);
  }

  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const author = typeof body.author === 'string' ? body.author.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';

  if (!slug || slug.length > MAX_SLUG_LENGTH) return json({ error: '缺少有效的 slug。' }, 400);
  if (!author) return json({ error: '请填写昵称。' }, 400);
  if (author.length > MAX_AUTHOR_LENGTH) return json({ error: `昵称请控制在 ${MAX_AUTHOR_LENGTH} 字以内。` }, 400);
  if (!content) return json({ error: '评论内容不能为空。' }, 400);
  if (content.length > MAX_CONTENT_LENGTH) return json({ error: `评论请控制在 ${MAX_CONTENT_LENGTH} 字以内。` }, 400);

  const createdAt = Math.floor(Date.now() / 1000);

  try {
    const result = (await context.env.DB.prepare(
      "INSERT INTO comments (article_slug, author, content, status, created_at) VALUES (?, ?, ?, 'approved', ?)",
    )
      .bind(slug, author, content, createdAt)
      .run()) as { meta?: { last_row_id?: number } };

    return json({
      ok: true,
      comment: {
        id: result.meta?.last_row_id ?? 0,
        author,
        content,
        created_at: createdAt,
      },
    });
  } catch (err) {
    return json({ error: `提交评论失败：${(err as Error).message}` }, 500);
  }
}

export async function onRequestDelete(context: CommentContext): Promise<Response> {
  if (!isAdmin(context)) {
    return json({ error: '未授权：需要有效的管理令牌。' }, 403);
  }

  const rawId = new URL(context.request.url).searchParams.get('id') || '';
  const id = Number.parseInt(rawId, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return json({ error: '缺少有效的评论 id。' }, 400);
  }

  try {
    await context.env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();
    return json({ ok: true, id });
  } catch (err) {
    return json({ error: `删除评论失败：${(err as Error).message}` }, 500);
  }
}
