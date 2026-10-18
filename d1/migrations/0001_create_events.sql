-- 0001：阅读事件表（T5 / M3）
-- 与 d1/schema.sql 保持一致。

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
