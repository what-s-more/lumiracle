---
title: "Vitest 实践：让覆盖率数字有含义"
date: "2026-02-23"
description: "Vitest 的配置、mock 策略与覆盖率解读——高数字不等于好测试，可测试性来自模块边界的划分"
category: "Notes"
tags: ["vitest", "testing", "coverage", "typescript"]
---

# Vitest 实践：让覆盖率数字有含义

覆盖率是个容易骗人的指标：把纯 UI 渲染测一遍就轻松到 90%，但真正会出 bug 的边界逻辑反而没测到。这篇文章记录本站测试体系的取舍，以及哪些数字值得看。

## 配置基线

```ts
// vitest.config.mts
export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs', 'functions/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'functions/lib/**'],
    },
  },
});
```

`include` 把覆盖统计限制在逻辑层。组件文件不进统计——不是它们不重要，而是快照测试给的数字没有诊断价值。`functions/**/*.test.ts` 进 test include 而不进 coverage include，是因为函数入口是薄壳，值得测的分支都在 `functions/lib` 里。

## mock 边界：mock 外部能力，不 mock 内部逻辑

测检索模块时的选择是 mock 两个绑定（`env.AI`、`env.VECTORIZE`），真实逻辑原样跑：

```ts
const env = {
  AI: { run: vi.fn().mockResolvedValue({ data: [new Array(1024).fill(0.1)] }) },
  VECTORIZE: { query: vi.fn().mockResolvedValue({ matches: [...] }) },
};
const chunks = await retrieve(env, '什么是 trailingSlash');
```

这样测的是「检索模块拿到数据后怎么处理」：空命中返回空数组、metadata 缺字段时的兜底、score 排序、slug 限定失败后的全站回退。这些分支才是出 bug 的地方。如果连 retrieve 内部都 mock 掉，测的就只剩调用顺序，毫无意义。

反过来，测试里连 `Response.json`、`ReadableStream` 都是真实的——workerd 的 API 在 Node 18+ 可直接用，不需要 polyfill。mock 得越少，测试越接近真相。

## 三个值得测的分支类型

经验上，接口处理函数的测试价值集中在三类分支：

1. **入参校验**：缺字段、类型错、超长——每个校验分支一个用例，断言状态码与错误文案。
2. **降级路径**：无命中、上游超时、绑定缺失——断言返回明确提示而不是 500 或空响应。
3. **成功路径的帧序列**：SSE 这类流式协议要断言「首帧是什么、中间有什么、最后一帧是什么」，帧顺序错了前端就废了。

普通 CRUD 的「写进去再读出来」用例优先级最低——那是在测数据库。

## 覆盖率数字怎么读

本站的数字：`functions/api` 97%、`functions/lib` 100%、全仓合计 67%。差距来自构建期模块（文章解析、数据生成），它们没有独立测试而是被「构建成功」间接验证。合计 67% 低吗？看构成：逻辑层接近全覆盖，构建期模块零覆盖但每次构建都在跑。比一个没有上下文的 95% 更可信。

真正要警惕的是 branch coverage 里的 `else` 分支：`if (x) return a; return b;` 这种写法，statement 覆盖率 100% 但 b 分支可能从没执行过。v8 provider 会把分支覆盖单独列出来，100% statement 但 branch 只有 70% 的模块，几乎总藏着没测的逻辑。

## watch 模式与 CI 的分工

本地开发用 `vitest`（watch 模式）跟改动联动，提交前 `vitest run --coverage` 拿一次完整数字。CI 里只跑后者的无 watch 版本。让 watch 模式承担「写代码时快速反馈」，让 CI 承担「防止回退」，两个场景不要混。
