# Lumiracle 博客

「静态导出 + 边缘函数」混合架构的个人博客：静态页面保证秒开与零运维，RAG 问答、阅读数据看板、评论等动态能力由 Cloudflare Pages Functions 在边缘提供。

## 架构

| 层 | 技术 | 说明 |
|---|---|---|
| 静态层 | Next.js 16（`output: 'export'`）→ `out/` | 页面在构建期生成，部署到 Cloudflare Pages，无运行时渲染 |
| 函数层 | `functions/api/*.ts`（Workers 运行时） | 随静态资源一起部署为 Pages Functions，无需独立服务 |
| 数据层 | Cloudflare Vectorize（文章向量索引）+ D1（阅读事件 / 评论） | Vectorize 维度 1024 / cosine；D1 库名 `lumiracle` |
| AI | Workers AI（`@cf/baai/bge-m3` 向量 + Llama 3.3 70B 生成） | RAG 检索与生成均在边缘完成 |
| 检索 | Pagefind（构建期生成的静态索引） | 关键词精确检索，客户端零后端请求 |
| 测试 | Vitest（单测）+ Playwright（E2E）+ GitHub Actions | 见下文「测试与覆盖率」 |

分工原则：

- **关键词检索 = Pagefind**（`SearchDialog`），**自然语言问答 = RAG**（`AskDialog` → `POST /api/chat`），两者职责互不重叠。
- RAG 回答必须携带可点验引用，点击跳转 `/posts/{slug}/#{anchor}` 命中对应段落。

```
src/               前端（静态导出）
functions/api/     Pages Functions：chat / stats / comment / health
functions/lib/     边缘侧公共逻辑：检索（retrieve）、提示词（prompt）
scripts/           索引构建（build-index）与 E2E 静态服务器（e2e-server）
posts/             Markdown 文章（RAG 索引的唯一数据源）
d1/                D1 表结构与迁移
e2e/               Playwright 端到端用例
```

## 快速开始

```bash
npm install
npm run dev          # 本地开发（http://localhost:3000，仅静态层）
npm run build        # 构建静态站点 + 生成 Pagefind 索引（输出 out/）
npm run lint         # ESLint
```

> 本地 `wrangler pages dev out` 无法经 miniflare 远程代理 Vectorize / Workers AI / D1 绑定，
> 因此边缘接口联调请使用 `scripts/e2e-server.mjs`（见下）或直接部署预览环境验证。

## 测试与覆盖率

```bash
npm run test            # Vitest 单测（54 例）
npm run test:coverage   # 带覆盖率报告（coverage/）
npm run test:e2e        # Playwright E2E（需先 npm run build）
```

单测覆盖：语义切分（`scripts/lib/chunk`）、检索与提示词拼装（`functions/lib/*`）、
Pagefind slug 解析（`src/lib/search`）、以及 `stats` / `comment` / `chat` 三个接口的入参校验与异常分支。

**最近一次覆盖率（`npm run test:coverage`，2026-10-18）：**

| 范围 | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| 合计 | 67.19% | 71.37% | 52.22% | 68.57% |
| `functions/api` | 97.25% | 86.91% | 96.55% | 98.78% |
| `functions/lib` | 100% | 88.37% | 100% | 100% |
| `scripts/lib` | 79.61% | 69.84% | 90% | 82.22% |
| `src/lib` | 3.22% | 5.71% | 2.38% | 3.57% |

> 合计被 `src/lib` 拉低：该目录含 `posts` / `gallery` / `changelog` 等依赖文件系统的构建期模块，未纳入单测范围。

### E2E

`scripts/e2e-server.mjs` 托管 `out/` 并把 `/api/*` 反向代理到 `E2E_API_BASE`：

```bash
npm run build
node scripts/e2e-server.mjs                                   # 仅静态用例（首页 → 文章页 → Pagefind 搜索命中）
E2E_API_BASE=https://<your-project>.pages.dev node scripts/e2e-server.mjs   # 追加问答/看板断言
npx playwright test
```

未设置 `E2E_BASE_URL` / `E2E_API_BASE` 时，`e2e/api.spec.ts` 自动跳过，静态用例照常执行。

## RAG 评测记录

20 条自测问答（15 条有据、5 条无据），直接复用 `functions/lib` 的真实检索与提示词逻辑，
连接真实 Vectorize 索引与 Workers AI 完成评测。

**结果（2026-10-18，共 20 条）：**

| 指标 | 结果 |
|---|---|
| 检索召回 Recall@5（有据问题命中期望锚点） | 15 / 15 |
| 拒答准确率（无据问题明确说明无法回答） | 5 / 5 |
| 回答引用率（回答含 `[来源: …]` 标注） | 15 / 15 |
| **综合准确率** | **20 / 20** |

有据问题示例：`trailingSlash 为什么要设为 true？` → 命中 `nextjs-static-export#trailingslash-true`（score 0.693），
回答含 `[来源: Next.js 静态导出部署到 Cloudflare Pages › 关键配置项 › trailingSlash: true]`。

无据问题示例：`红烧肉怎么做才好吃？` → 明确拒答「根据现有资料无法回答该问题」。

## 索引构建

```bash
node scripts/build-index.mjs --dry-run   # 本地校验切分，无需凭据
npm run index                            # 全量重建（先清空再 upsert）
```

写入模式需环境变量：`CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN`（可选 `VECTORIZE_INDEX`、`EMBED_MODEL`、`EMBED_DIM`）。

以 `slug#anchor` 作为向量 id；重建时先按索引前缀删除再 upsert，保证幂等。

## 部署

绑定配置见 `wrangler.toml`（Vectorize / D1 / AI）。首次部署前需要：

```bash
npx wrangler login
npx wrangler pages project create lumiracle-blog     # 若尚未创建 Pages 项目
npx wrangler pages secret put ADMIN_TOKEN           # 评论管理端删除令牌（未配置时管理操作一律 403）
npx wrangler pages deploy out --project-name lumiracle-blog
```

### CI

`.github/workflows/ci.yml` 流程：`lint → vitest(含覆盖率) → build(含 Pagefind) → Playwright → 部署 Pages → 索引重建`。

- 部署与索引重建仅在主干分支 push 时触发；
- 索引重建仅在 `posts/` 变更时执行，避免无谓的 embedding 消耗；
- 需在仓库 Secrets 中配置 `CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID`；
- 可选仓库变量 `E2E_BASE_URL` 指向部署预览域名，以启用 E2E 中的问答 / 看板 API 断言。

### 环境变量（Pages）

| 变量 | 作用 | 必需 |
|---|---|---|
| `ADMIN_TOKEN` | 评论管理端删除令牌（secret） | 需删除评论时 |
| `CHAT_MODEL` | 覆盖默认生成模型 `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | 否 |
| `STATS_SALT` | 阅读 UV 去重所用的 UA 哈希盐值 | 否 |

> 密钥通过 `wrangler pages secret put <NAME>` 注入，`.env*` 已在 `.gitignore` 中排除，密钥不进入仓库。
