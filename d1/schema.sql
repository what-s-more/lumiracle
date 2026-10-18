-- Lumiracle D1 schema
--
-- 阅读事件表（T5 / M3）：
--   pv / uv 均在查询侧聚合：
--     pv = COUNT(*)
--     uv = COUNT(DISTINCT ua_hash)   —— 以 UA 哈希做去重键，不落原始 UA
--   ts 统一存 Unix 秒，便于 SQLite date(ts, 'unixepoch') 分组。

CREATE TABLE IF NOT EXISTS events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  path         TEXT    NOT NULL,
  article_slug TEXT,
  referrer     TEXT,
  ua_hash      TEXT    NOT NULL,
  ts           INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_ts  ON events(ts);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(article_slug);
CREATE INDEX IF NOT EXISTS idx_events_hash ON events(ua_hash);

-- 文章评论表（T6 / M4）
--
-- 站点无登录体系，采用「先发布、后审核」：新评论默认 status='approved' 立即可见，
-- 站内 GET 仅返回 approved；管理端凭 ADMIN_TOKEN 调 DELETE 移除违规内容。
-- status 预留 pending / rejected，便于后续切换为前置审核。

CREATE TABLE IF NOT EXISTS comments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  article_slug TEXT    NOT NULL,
  author       TEXT    NOT NULL,
  content      TEXT    NOT NULL,
  status       TEXT    NOT NULL DEFAULT 'approved',
  created_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_slug ON comments(article_slug, status, created_at);
