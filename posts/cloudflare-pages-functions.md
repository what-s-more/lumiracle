---
title: "Cloudflare Pages Functions：从静态站点到边缘函数"
date: "2026-01-12"
description: "Pages Functions 的路由约定、绑定注入与运行时限制，以及在纯静态项目上增量挂载后端能力的方法"
category: "Tutorial"
tags: ["cloudflare-pages", "functions", "edge", "serverless"]
---

# Cloudflare Pages Functions：从静态站点到边缘函数

静态导出解决了渲染问题，但表单、统计、搜索这类需要服务端参与的功能仍然缺一块。Pages Functions 用「函数即文件」的方式补上了这块，而且不需要单独维护一个 Worker 项目。

## 文件即路由

在项目根目录建 `functions/` 目录，文件路径直接映射为 API 路径：`functions/api/health.ts` 对应 `/api/health`，静态资源与函数共用同一个域名，不需要配置反向代理。导出的处理函数按 HTTP 方法命名：

```ts
// functions/api/health.ts
export async function onRequestGet(): Promise<Response> {
  return Response.json({ status: "ok" });
}
```

`onRequestGet`、`onRequestPost`、`onRequestPut` 各管一个方法；不区分方法时用 `onRequest`。静态资源命中优先于函数，所以 `/api/chat` 这种路径不会被 `out/` 目录里的同名文件覆盖——反过来，任何没有函数的路径都回落到静态文件。

## 绑定是环境变量形态的能力注入

Functions 与外部服务的连接靠「绑定」：在 `wrangler.toml` 里声明 D1、Vectorize、Workers AI 等资源，部署后以 `context.env` 的形式出现在处理函数里。绑定不是连接字符串，而是一组可直接调用的客户端对象：

```ts
type Env = {
  DB: D1Database;          // SQL
  VECTORIZE: VectorizeIndex; // 向量检索
  AI: Ai;                  // 推理模型
};

export async function onRequestPost(context: { env: Env; request: Request }) {
  const result = await context.env.DB.prepare("SELECT 1").run();
  return Response.json({ rows: result.results });
}
```

这个设计的好处是本地与线上行为一致：`wrangler pages dev` 提供本地模拟，`wrangler pages deploy` 直接把绑定带上生产环境，代码里不需要 if-else 切换环境。

## 运行时限制要先知道

Functions 跑在 workerd 上，不是 Node.js。三件事在写代码前就要想清楚：

- 没有原生模块。任何依赖 `node:crypto` C++ 实现的库都会在部署时或运行时报错，Web Crypto API（`crypto.subtle`）是替代品。
- 没有文件系统。不能读本地 JSON 配置文件，配置要么打进代码，要么放 KV/D1。
- CPU 时间有上限。免费计划单请求 10ms CPU 时间，纯 I/O 等待不算在内，但同步的重计算会立刻爆掉。

本站的问答接口最初想把 shiki 高亮放在函数里做，就是被 CPU 限制劝退的——高亮最终留在了构建期。

## 与 Next.js 静态导出配合

`output: 'export'` 产出的 `out/` 目录是纯静态文件，Pages 部署目录指向它即可，`functions/` 与 `out/` 平级共存。构建流水线变成两步：`next build` 生成静态页面，Pages 自动把 `functions/` 编译成边缘函数，两套产物互不干扰。

这个组合的分工很清晰：页面路由、SSG、资源优化全部交给 Next.js；动态能力（API、鉴权、数据写入）交给 Functions。比单独用 Next.js 的 API Routes 更省心，因为静态导出模式下 API Routes 本来就不可用。

## 什么时候不合适

需要长连接（WebSocket 服务端主动推）、需要长时间运行的任务、需要访问 Node 生态特定库的场景，Functions 都不是好选择。好在 Pages 项目可以随时添加自定义域名的 Worker 路由，把重活分流给独立的 Worker，架构上留了退路。
