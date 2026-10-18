# 博客全栈改造 · 任务拆分计划

> **面向 AI 代理的工作者：** 使用复选框（`- [ ]`）语法跟踪进度。每个任务完成即提交（Commit），任务内步骤顺序执行。
> **来源方案：** [项目方案-博客全栈改造.md](file:///c:/Users/24953/Desktop/实验/项目方案-博客全栈改造.md)

**目标：** 在**不改动现有静态页面与视觉**的前提下，为 Lumiracle 博客以「静态 + 边缘函数」混合架构增量挂载 RAG 问答、全文搜索升级、阅读数据看板、测试体系与 CI。

**架构：**
- 静态层不变：`next build`（`output: 'export'`）→ `out/` → Cloudflare Pages
- 函数层新增：`functions/api/*.ts`（Workers 运行时，随静态资源自动部署为 Pages Functions）
- 数据层新增：Cloudflare Vectorize（文章向量索引）+ D1（阅读事件 / 评论）
- AI：Workers AI（embedding + 生成），密钥用 Pages secret 注入
- CI：GitHub Actions（lint → Vitest → Playwright → build → deploy → 索引重建）

**技术栈：** Next.js 16.2.6 / React 19 / Tailwind 4 / TS / Cloudflare Pages Functions / Workers AI / Vectorize / D1 / Wrangler / Vitest / Playwright / Pagefind / Recharts

**现状基线（已核对）：**
- 已存在：`src/app/{page,archive,about,categories,changelog}`、`src/components/*`、`src/lib/{posts,site-config,gallery,changelog,...}.ts`、`posts/*.md`（2 篇）、`data/`、`mysvg/`
- 缺失：`functions/`、`wrangler.toml`、测试目录、`.github/workflows`、`.git`（仓库未初始化）
- 依赖现状：`gray-matter` / `js-yaml` / `motion` / `shiki` / `remark-gfm` 已装；未装 `wrangler` / `vitest` / `playwright` / `pagefind` / `recharts`

---

## 文件结构

| 文件 / 目录 | 操作 | 职责 | 归属任务 |
|---|---|---|---|
| `wrangler.toml` | 新建 | Workers/Pages 绑定配置（Vectorize / D1 / AI） | T0 |
| `.github/workflows/ci.yml` | 新建 | lint→test→e2e→build→deploy→索引重建 | T0 / T7 |
| `vitest.config.mts` | 新建 | 单测配置 | T0 |
| `playwright.config.ts` | 新建 | E2E 配置 | T7 |
| `scripts/build-index.mjs` | 新建 | 遍历 posts → 切分 → embedding → upsert Vectorize | T1 |
| `scripts/lib/chunk.mjs` | 新建 | 按标题层级切分（300–500 token，带标题路径前缀） | T1 |
| `functions/api/chat.ts` | 新建 | RAG：问题→embedding→topK→拼装→生成→流式返回 | T2 |
| `functions/api/stats.ts` | 新建 | 阅读事件读写（D1） | T5 |
| `functions/api/comment.ts` | 新建（可选） | 评论读写（D1） | T6 |
| `functions/lib/*.ts` | 新建 | 函数公共逻辑（embedding、检索、prompt 模板） | T2 |
| `src/components/AskDialog.tsx` | 新建 | 全局问答 UI（流式渲染 + 引用来源） | T3 |
| `src/components/PostAsk.tsx` | 新建 | 文章页内问答入口 | T3 |
| `src/components/StatsBeacon.tsx` | 新建 | `navigator.sendBeacon` 埋点 | T5 |
| `src/app/dashboard/page.tsx` | 新建 | Recharts 看板页 | T5 |
| `src/app/globals.css` | 修改 | 问答 / 看板样式（仅追加） | T3 / T5 |
| `src/app/layout.tsx` | 修改 | 挂载 AskDialog / StatsBeacon | T3 / T5 |
| `src/components/Header.tsx` + `src/lib/site-config.ts` | 修改 | 问答入口、dashboard 导航 | T3 / T5 |
| `src/lib/search.ts` / `SearchDialog.tsx` | 修改 | 数据源切到 Pagefind | T4 |
| `d1/schema.sql` + `d1/migrations/*` | 新建 | D1 表结构 | T5 |
| `src/**/*.test.ts` / `e2e/*.spec.ts` | 新建 | Vitest 单测 / Playwright E2E | T7 |
| `README.md` | 修改 | 补架构、覆盖率、RAG 评测记录 | T7 |

---

### 任务 0（D1）：基础设施与边缘能力预验证

**目标：** 打通 Wrangler / 绑定 / 单测环境，**第一天就验证 edge 限制**（红线 3）。

- [ ] **步骤 1：初始化 git 与依赖**

```bash
git init
npm install -D wrangler vitest @vitest/coverage-v8 @playwright/test pagefind
npm install recharts
```

- [ ] **步骤 2：创建 `wrangler.toml`**（对齐方案 §4.2）

```toml
name = "lumiracle-blog"
compatibility_date = "2026-10-01"
pages_build_output_dir = "out"

[[vectorize]]
binding = "VECTORIZE"
index_name = "posts"

[[d1_databases]]
binding = "DB"
database_name = "lumiracle"

[ai]
binding = "AI"
```

- [ ] **步骤 3：创建云端资源**

```bash
npx wrangler vectorize create posts --dimensions=1024 --metric=cosine
npx wrangler d1 create lumiracle
```

> 维度必须与 embedding 模型一致（`@cf/baai/bge-m3` = 1024）；若换模型需删除重建索引。

- [ ] **步骤 4：创建 `functions/api/health.ts` 冒烟测试**

验证：AI binding 可调用 embedding、Vectorize 可写入、D1 可读写。

```bash
npx wrangler pages dev out   # 先 npm run build 生成 out/
curl http://localhost:8788/api/health
```

预期：返回 `{ ai: ok, vectorize: ok, d1: ok }`。**任一项失败则先解决再进入 T1**（edge 无 Node 原生模块，禁止 ioredis）。

- [ ] **步骤 5：接入 Vitest**

创建 `vitest.config.ts`，`package.json` 加脚本 `"test": "vitest"`，写 1 条示例单测验证 `chunk` 逻辑。

- [ ] **步骤 6：Commit**

```bash
git add wrangler.toml vitest.config.ts package.json functions/api/health.ts
git commit -m "chore: bootstrap wrangler bindings, edge smoke test and vitest"
```

---

### 任务 1（D2）：M1-A 索引构建脚本

**目标：** 遍历 `posts/**/*.md`，按标题层级切分并写入 Vectorize。

- [ ] **步骤 1：`scripts/lib/chunk.mjs` —— 语义切分**

输入 markdown 正文，输出块数组；每块含 `{ text, title, slug, anchor }`，保留标题路径作上下文前缀。块大小 300–500 token，按 `#/##/###` 层级切，不按定长硬切。

- [ ] **步骤 2：`scripts/build-index.mjs` —— 生成向量并 upsert**

流程：读 `posts/*.md`（复用 gray-matter 解析 frontmatter）→ chunk → `env.AI.run('@cf/baai/bge-m3', ...)` 批量 embedding → `env.VECTORIZE.upsert(vectors)`，metadata 存 `title / slug / anchor`。

- [ ] **步骤 3：可重复运行（幂等）**

以 `slug#anchor` 作为 vector id；重建时按命名空间前缀先 delete 再 upsert，避免重复堆积。

- [ ] **步骤 4：验证**

```bash
node scripts/build-index.mjs
npx wrangler vectorize info posts   # 查看向量数量
```

预期：向量数 = 切分块总数；改一篇文章后重跑，数量与内容对应更新。

- [ ] **步骤 5：Commit**

```bash
git add scripts/
git commit -m "feat: add post chunking and vectorize index build script"
```

---

### 任务 2（D2–D4）：M1-B 检索 + 生成 Function（流式）

**目标：** 实现 `functions/api/chat.ts`，问题→检索→拼装→生成→流式返回。

- [ ] **步骤 1：`functions/lib/retrieve.ts` —— 检索**

问题 → `AI.run(embedding)` → `VECTORIZE.query(topK=5, returnMetadata=true)` → 返回带来源的命中块。

- [ ] **步骤 2：`functions/lib/prompt.ts` —— 约束模板**

系统提示强约束「只基于给定资料回答，资料不足则明确说明」，拼接命中块（含来源标题）为上下文。

- [ ] **步骤 3：`functions/api/chat.ts` —— 流式响应**

返回 `ReadableStream`（SSE 或纯文本流）。响应体首帧携带 `sources`（slug + 标题 + 锚点），随后流式推正文。

- [ ] **步骤 4：错误与降级**

无命中、模型超时、embedding 失败分别返回明确提示，不裸奔输出。

- [ ] **步骤 5：验证**

```bash
npx wrangler pages dev out
# 用 curl 或前端联调提问，确认：有引用来源 + 逐字流式
```

- [ ] **步骤 6：Commit**

```bash
git add functions/
git commit -m "feat: add RAG retrieval and streaming chat endpoint"
```

---

### 任务 3（D3–D4）：M1-C 前端问答 UI

**目标：** 全局问答入口 + 文章页内问答，流式渲染 + 引用来源可点验（红线 2）。

- [ ] **步骤 1：`src/components/AskDialog.tsx`**

客户端组件：输入框 + 流式渲染区 + 引用来源列表（点击跳 `/posts/{slug}/#{anchor}`）。可复用 `SearchDialog` 的弹窗交互范式与样式语言。

- [ ] **步骤 2：`src/components/PostAsk.tsx`**

文章页内嵌问答入口（可带入当前文章 slug 作检索偏向）。

- [ ] **步骤 3：挂载到 `layout.tsx` + Header 入口**

在 `LazyMotion` 内挂载 `AskDialog`；`Header.tsx` / `site-config.ts` 增加问答入口。**仅新增，不改动现有页面结构。**

- [ ] **步骤 4：`globals.css` 追加问答样式**

只追加新类，不改现有变量与既有类。

- [ ] **步骤 5：验证**

```bash
npm run build   # 静态导出成功
npm run dev
```

预期：提问得到流式回答，每条回答附来源且点击可跳转、命中对应段落；资料外问题明确拒答。

- [ ] **步骤 6：Commit**

```bash
git add src/components/AskDialog.tsx src/components/PostAsk.tsx src/app/layout.tsx src/components/Header.tsx src/app/globals.css
git commit -m "feat: add streaming RAG Q&A UI with citations"
```

---

### 任务 4（D5）：M2 Pagefind 全文搜索升级

**目标：** 用 Pagefind 静态索引替换 `SearchDialog` 的运行时数据源，客户端零请求。

- [ ] **步骤 1：构建后生成索引**

`package.json` build 脚本追加 `&& npx pagefind --site out`（在 `next build` 之后）。

- [ ] **步骤 2：改写 `src/lib/search.ts`（或新建）**

封装 `pagefind` 客户端加载与查询，替换 `getSearchIndex()` 数据源。

- [ ] **步骤 3：改造 `SearchDialog.tsx`**

保留 UI 与键盘交互，检索调用切到 Pagefind，结果指向文章 URL。

- [ ] **步骤 4：明确分工**

关键词精确检索 = Pagefind；自然语言问答 = `AskDialog`。

- [ ] **步骤 5：验证**

```bash
npm run build
# 用 serve out/ 本地起静态服务，搜索关键词命中文章
```

- [ ] **步骤 6：Commit**

```bash
git add package.json src/lib/search.ts src/components/SearchDialog.tsx
git commit -m "feat: switch full-text search to pagefind static index"
```

---

### 任务 5（D6）：M3 阅读数据看板

**目标：** `functions/api/stats.ts` 读写 D1；`/dashboard` 用 Recharts 可视化真实访问。

- [ ] **步骤 1：D1 表结构**（`d1/schema.sql` + migration）

`events(path, article_slug, referrer, ua_hash, ts)`；pv / uv（按 ua_hash 去重）在查询侧聚合。

- [ ] **步骤 2：`functions/api/stats.ts`**

`POST` 写入事件；`GET` 返回聚合（pv / uv / 来源 / 文章维度）。

- [ ] **步骤 3：`src/components/StatsBeacon.tsx`**

`navigator.sendBeacon` 上报，不阻塞页面；挂载进 `layout.tsx`。

- [ ] **步骤 4：`src/app/dashboard/page.tsx`**

Recharts 图表页；注意其为静态导出页，客户端 `fetch` 拉 `/api/stats`。

- [ ] **步骤 5：导航入口**

`site-config.ts` 增加 `/dashboard`（或仅在页脚/关于页入口，避免污染主导航）。

- [ ] **步骤 6：验证**

```bash
npx wrangler pages dev out
# 访问站点产生浏览，打开 /dashboard 看到真实数据
```

- [ ] **步骤 7：Commit**

```bash
git add d1/ functions/api/stats.ts src/components/StatsBeacon.tsx src/app/dashboard/ src/lib/site-config.ts
git commit -m "feat: add D1-backed reading stats and dashboard"
```

---

### 任务 6（D7，可选）：M4 评论互动

> **时间紧可整块砍掉**（红线优先顺序：M4 最先砍，其次 M2）。

- [ ] **步骤 1：`d1/schema.sql` 追加评论表**（内容 + 审核状态 + 时间）

- [ ] **步骤 2：`functions/api/comment.ts`**（读写 + 管理端删除）

- [ ] **步骤 3：文章页评论组件 + 管理删除入口**

- [ ] **步骤 4：验证 + Commit**

```bash
git add functions/api/comment.ts src/components/ src/app/posts/
git commit -m "feat: add D1 comment system with moderation"
```

> 兜底方案：Utterances（GitHub Issues）——零后端但无后端故事，仅在砍掉本任务时采用。

---

### 任务 7（D7）：M5 测试体系 + CI 全流程 + 部署验证

**目标：** Vitest 单测 + Playwright E2E + GitHub Actions 全流程；覆盖率写入 README。

- [ ] **步骤 1：Vitest 单测**

组件单测 + 切分/检索逻辑单测（embedding 调用 mock）。

- [ ] **步骤 2：`playwright.config.ts` + `e2e/*.spec.ts`**

关键路径 E2E：首页 → 文章页 → 问答得到带引用的回答 → 看板有数据。

- [ ] **步骤 3：`.github/workflows/ci.yml`**

顺序：`lint` → `vitest` → `playwright` → `next build`（含 Pagefind）→ 部署 Cloudflare Pages（wrangler-action）→ 索引重建 job（检出 posts → `build-index.mjs` → upsert Vectorize，仅内容变更触发）。

- [ ] **步骤 4：密钥注入**

外部生成模型 API key 用 Pages 项目 secret；CI 用 GitHub Secrets；**密钥不进仓库**。

- [ ] **步骤 5：README 更新**

补：架构说明、测试覆盖率、**20 条自测问答准确率**（工程评测记录，红线 1）。

- [ ] **步骤 6：部署验证**

```bash
# 推送触发 Actions，确认部署 + 索引重建成功，线上域名可访问问答
```

- [ ] **步骤 7：Commit**

```bash
git add .github/ playwright.config.ts e2e/ src/**/*.test.ts README.md
git commit -m "ci: add vitest, playwright E2E and full pipeline with index rebuild"
```

---

## 依赖关系与排期映射

```
T0 基础设施（D1）
   ├─▶ T1 索引脚本 ─▶ T2 chat Function ─▶ T3 前端问答 UI   （D2–D4，M1 主线）
   ├─▶ T4 Pagefind 搜索                                    （D5，M2）
   └─▶ T5 数据看板                                        （D6，M3）
T6 评论（D7，可选，最先砍）
T7 测试 + CI + 部署验证            （D7，M5，收尾）
```

| 方案日 | 任务 |
|---|---|
| D1 | T0 |
| D2–D4 | T1 → T2 → T3 |
| D5 | T4 |
| D6 | T5 |
| D7 | T6（可选）+ T7 |

> 并行原则：商城改造吃紧时博客让位，砍单顺序 M4 → M2。

---

## 红线自检（每任务收尾确认）

- [ ] **数据真实**：看板为本站真访问；RAG 用 20 条自测记录准确率
- [ ] **不许套壳**：问答必须带可点验引用；回答不出所引文章内容即失败
- [ ] **edge 首日验证**：`wrangler dev` 先跑通 AI/Vectorize 再写业务（T0）
- [ ] **索引重建入 CI**：防止「问答内容过期」的一眼假状态（T7）
- [ ] **不动静态层**：现有页面与视觉零改动，增量以「静态 + 边缘函数」挂载
