---
title: "D1 入门：在边缘使用 SQLite 数据库"
date: "2026-01-26"
description: "D1 的建库、迁移、查询与去重统计实践，以及为什么边缘 SQLite 比「连云数据库」更省事"
category: "Tutorial"
tags: ["cloudflare-d1", "sqlite", "database", "sql"]
---

# D1 入门：在边缘使用 SQLite 数据库

给博客加阅读统计时纠结过选型：Supabase 要管连接池，Turso 要多一层服务，最后发现 D1 就够——它是 Cloudflare 托管的 SQLite，绑定即用，没有连接字符串，没有网络跳数。

## 建库与迁移

```bash
npx wrangler d1 create lumiracle
npx wrangler d1 execute lumiracle --remote --file=./d1/schema.sql
```

`wrangler.toml` 里声明绑定后，`schema.sql` 的写法就是普通 SQLite：

```sql
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  article_slug TEXT,
  referrer TEXT,
  ua_hash TEXT,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
```

注意 `--remote` 与不加的区别：不加时写到本地模拟库，加 `--remote` 才落到线上。调试时在本地库试 schema，确认后用 migration 文件推到远端，避免两边结构漂移。

## 查询接口

D1 的查询是链式的：`prepare` 编译语句，`bind` 填参数，`all` 拿结果集，`run` 用于写操作：

```ts
const row = await env.DB.prepare(
  "SELECT COUNT(*) AS pv, COUNT(DISTINCT ua_hash) AS uv FROM events WHERE ts > ?"
).bind(sinceTs).first<{ pv: number; uv: number }>();
```

参数一律走 `bind`，不要拼接 SQL。D1 对预编译语句做了缓存，同一形状的语句反复执行开销很低。

## UV 统计的去重思路

UV 的实现最容易踩坑。按天去重、按 UA 哈希去重、全站去重是三个不同的口径，写进一条 SQL 会变成嵌套子查询，可读性极差。本站的做法是把口径拆开：

```sql
-- 按 UA 去重的访问者数（7 天窗口）
SELECT COUNT(DISTINCT ua_hash) AS uv FROM events WHERE ts > ?1;
-- 每日的 PV 与 UV
SELECT DATE(ts / 1000, 'unixepoch') AS day,
       COUNT(*) AS pv,
       COUNT(DISTINCT ua_hash) AS uv
FROM events WHERE ts > ?1 GROUP BY day ORDER BY day;
```

`ua_hash` 在写入侧算好（SHA-256 截断），查询侧只做聚合。原则是：能写入时预处理的信息不要留给查询时计算，D1 的 CPU 配额比聚合能力更稀缺。

## 事务与一致性

D1 支持 `batch` 批量执行，同一 batch 内的语句在一个事务里提交：

```ts
await env.DB.batch([
  env.DB.prepare("INSERT INTO events (path, ts) VALUES (?1, ?2)").bind(path, ts),
  env.DB.prepare("UPDATE counters SET pv = pv + 1").bind(),
]);
```

单条 `run` 自身是原子的，只有跨语句的一致性要求才需要 `batch`。阅读统计这种场景丢一条事件无所谓，就没必要为它引入 batch 的复杂度。

## 备份与导出

```bash
npx wrangler d1 export lumiracle --remote --output=backup.sql
```

D1 支持时间点恢复（企业计划），免费计划建议定期 export 一份 SQL 快照放进私有存储。数据不大的时候，这个土办法最可靠。
