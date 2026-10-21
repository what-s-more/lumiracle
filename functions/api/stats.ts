/**
 * 阅读数据接口（T5 / M3）
 *
 * POST /api/stats  { path, articleSlug?, referrer? }
 *   写入一条阅读事件（前端由 StatsBeacon 用 navigator.sendBeacon 上报）。
 * GET  /api/stats?days=7
 *   返回 PV / UV / 来源 / 文章维度聚合。pv / uv 均在查询侧聚合：
 *   pv = COUNT(*)，uv = COUNT(DISTINCT ua_hash)。
 *
 * ua_hash 由 UA + 站点盐值做 SHA-256 截断而来，不落原始 UA（避免直接存 PII）。
 * 与 functions/api/health.ts 一样自建最小绑定类型，不引入 @cloudflare/workers-types。
 */

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = unknown>(): Promise<{ results?: T[] }>;
  run(): Promise<unknown>;
}

interface D1Binding {
  prepare(query: string): D1PreparedStatement;
}

interface StatsEnv {
  DB: D1Binding;
  /** 可选：UA 哈希盐值，未配置时使用内置常量 */
  STATS_SALT?: string;
}

interface StatsContext {
  env: StatsEnv;
  request: Request;
}

/** 事件写入的最小校验：path 必须是以 / 开头的站内路径 */
const MAX_PATH_LENGTH = 512;
const MAX_REFERRER_LENGTH = 512;
const DEFAULT_DAYS = 7;
const MAX_DAYS = 90;
const FALLBACK_SALT = 'lumiracle-stats-v1';

interface DailyRow {
  day: string;
  pv: number;
  uv: number;
}
interface SourceRow {
  source: string;
  pv: number;
  uv: number;
}
interface ArticleRow {
  slug: string;
  pv: number;
  uv: number;
}

/** UA → 哈希（十六进制截断 32 位），仅用于 UV 去重。 */
async function hashUa(ua: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${ua}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** 生成最近 days 天的 UTC 日期序列（升序，含今天），用于补齐无数据的日期。 */
function recentDays(days: number): string[] {
  const list: string[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today.getTime() - i * 86_400_000);
    list.push(d.toISOString().slice(0, 10));
  }
  return list;
}

export async function onRequestPost(context: StatsContext): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: '请求体必须是 JSON。' }, { status: 400 });
  }

  const path = typeof body.path === 'string' ? body.path.trim() : '';
  if (!path || !path.startsWith('/') || path.length > MAX_PATH_LENGTH) {
    return Response.json({ error: 'path 无效。' }, { status: 400 });
  }

  const rawSlug = typeof body.articleSlug === 'string' ? body.articleSlug.trim() : '';
  const articleSlug = rawSlug || null;
  const rawReferrer = typeof body.referrer === 'string' ? body.referrer.trim() : '';
  const referrer = rawReferrer ? rawReferrer.slice(0, MAX_REFERRER_LENGTH) : null;

  const ua = context.request.headers.get('User-Agent') || 'unknown';
  const uaHash = await hashUa(ua, context.env.STATS_SALT || FALLBACK_SALT);

  try {
    await context.env.DB.prepare(
      'INSERT INTO events (path, article_slug, referrer, ua_hash, ts) VALUES (?, ?, ?, ?, ?)',
    )
      .bind(path, articleSlug, referrer, uaHash, nowSeconds())
      .run();
  } catch {
    // 埋点失败不应影响阅读体验
    return new Response(null, { status: 204 });
  }

  return new Response(null, { status: 204 });
}

export interface StatsAggregate {
  range: { days: number; since: number };
  totals: { pv: number; uv: number };
  daily: DailyRow[];
  referrers: Array<{ source: string; pv: number; uv: number }>;
  articles: Array<{ slug: string; pv: number; uv: number }>;
  updatedAt: string;
}

/**
 * 聚合最近 days 天的阅读数据（GET /api/stats 与 Agent 工具 get_stats 共用）。
 * 按日期补齐空档，避免图表出现断点。
 */
export async function collectStats(env: StatsEnv, days: number): Promise<StatsAggregate> {
  const since = nowSeconds() - days * 86_400;
  const { DB } = env;

  const totalsRow = await DB.prepare(
    'SELECT COUNT(*) AS pv, COUNT(DISTINCT ua_hash) AS uv FROM events WHERE ts >= ?',
  )
    .bind(since)
    .all<{ pv: number; uv: number }>();

  const dailyRows = await DB.prepare(
    `SELECT date(ts, 'unixepoch') AS day, COUNT(*) AS pv, COUNT(DISTINCT ua_hash) AS uv
       FROM events WHERE ts >= ? GROUP BY day`,
  )
    .bind(since)
    .all<DailyRow>();

  const sourceRows = await DB.prepare(
    `SELECT COALESCE(NULLIF(referrer, ''), 'direct') AS source, COUNT(*) AS pv, COUNT(DISTINCT ua_hash) AS uv
       FROM events WHERE ts >= ? GROUP BY source ORDER BY pv DESC LIMIT 10`,
  )
    .bind(since)
    .all<SourceRow>();

  const articleRows = await DB.prepare(
    `SELECT article_slug AS slug, COUNT(*) AS pv, COUNT(DISTINCT ua_hash) AS uv
       FROM events
      WHERE ts >= ? AND article_slug IS NOT NULL AND article_slug != ''
      GROUP BY slug ORDER BY pv DESC LIMIT 20`,
  )
    .bind(since)
    .all<ArticleRow>();

  const totals = totalsRow.results?.[0] ?? { pv: 0, uv: 0 };

  // 按日期补齐，避免图表出现空档
  const byDay = new Map((dailyRows.results ?? []).map((row) => [row.day, row]));
  const daily = recentDays(days).map((day) => byDay.get(day) ?? { day, pv: 0, uv: 0 });

  return {
    range: { days, since },
    totals,
    daily,
    referrers: (sourceRows.results ?? []).map((row) => ({
      source: row.source,
      pv: row.pv,
      uv: row.uv,
    })),
    articles: (articleRows.results ?? []).map((row) => ({
      slug: row.slug,
      pv: row.pv,
      uv: row.uv,
    })),
    updatedAt: new Date().toISOString(),
  };
}

export async function onRequestGet(context: StatsContext): Promise<Response> {
  const url = new URL(context.request.url);
  const rawDays = Number.parseInt(url.searchParams.get('days') || '', 10);
  const days = Number.isFinite(rawDays) ? Math.min(Math.max(rawDays, 1), MAX_DAYS) : DEFAULT_DAYS;

  try {
    const aggregate = await collectStats(context.env, days);
    return Response.json({ ok: true, ...aggregate }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return Response.json({ error: `聚合失败：${(err as Error).message}` }, { status: 500 });
  }
}
