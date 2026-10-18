-- 0002：文章评论表（T6 / M4）
-- 与 d1/schema.sql 保持一致。

CREATE TABLE IF NOT EXISTS comments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  article_slug TEXT    NOT NULL,
  author       TEXT    NOT NULL,
  content      TEXT    NOT NULL,
  status       TEXT    NOT NULL DEFAULT 'approved',
  created_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_slug ON comments(article_slug, status, created_at);
