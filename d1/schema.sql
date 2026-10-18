-- 阅读事件表（T5 / M3）
--
-- pv / uv 均在查询侧聚合：
--   pv = COUNT(*)
--   uv = COUNT(DISTINCT ua_hash)   —— 以 UA 哈希做去重键，不落原始 UA
-- ts 统一存 Unix 秒，便于 SQLite date(ts, 'unixepoch') 分组。

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
