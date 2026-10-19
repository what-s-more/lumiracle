---
title: "Playwright E2E：稳定断言的三个原则"
date: "2026-03-09"
description: "Playwright 的选择器策略、strict mode 与环境隔离——E2E 测试不稳定的原因几乎都是写法问题"
category: "Notes"
tags: ["playwright", "e2e", "testing", "automation"]
---

# Playwright E2E：稳定断言的三个原则

E2E 测试的名声常被「不稳定」毁掉：本地过、CI 挂，重跑又过。折腾完本站的 E2E 之后，我的结论是：不稳定的根源几乎都是写法问题，不是工具问题。

## 原则一：按角色和文本选，不按 CSS 类选

```ts
// 脆弱：类名重构即失效
await page.locator('.btn-primary-submit').click();
// 稳定：描述用户视角的可交互物
await page.getByRole('button', { name: '提问' }).click();
```

`getByRole` 和 `getByText` 表达的是「用户看到什么」，CSS 类表达的是「代码怎么写」。前者在重构、换样式框架时依然成立。文本断言同理：断言「页面包含题目的来源标题」比断言「第 3 个 div 里有某个字」活得久得多。

strict mode 是隐性的帮手：选择器命中多个元素时 Playwright 直接报错而不是静默用第一个。本站踩过一次——文章页有两个 `h1`（文章标题 + 隐藏的站点标题），`getByRole('heading', { level: 1 })` 立刻失败，逼着把选择器写准确。strict mode 报的每个错都是一次「你的断言在表达什么」的拷问。

## 原则二：断言条件成立，而不是断言等了多久

```ts
// 脆弱：流式回答可能 2 秒也可能 8 秒
await page.waitForTimeout(3000);
// 稳定：等到条件成立，超时才失败
await page.waitForFunction(() =>
  document.querySelector('[data-answer]')?.textContent?.includes('来源'),
  { timeout: 15_000 },
);
```

`waitForTimeout` 是所有 flaky 测试的共同开头。Playwright 的自动等待已经覆盖了大部分场景（`expect(locator).toHaveText` 自带轮询），剩下异步流式这类场景用 `waitForFunction` 表达「等什么」，而不是「等多久」。

## 原则三：环境差异用配置吸收，不用 if-else

E2E 分两类：纯静态断言（页面能开、导航能点、搜索有结果）和依赖后端的断言（问答返回引用、看板有数据）。把它们混在一个套件里，就会在「本地没有后端」时集体失败。

本站的做法是环境变量开关加 `test.skip`：

```ts
const apiBase = process.env.E2E_API_BASE;
(apiBase ? test : test.skip)('问答返回带引用的回答', async ({ page }) => {
  // ...
});
```

静态用例在任何环境都跑；API 用例只在配置了后端地址的环境（CI 里指向线上预览域名）跑。测试文件里没有 `if (isCI)` 的分叉逻辑，环境差异全部由配置吸收。

## trace 是调试的第一入口

失败的 E2E 不要靠 console.log 猜。`npx playwright test --trace on` 生成 trace，`npx playwright show-trace` 打开时间线：每一步的截图、网络请求、DOM 快照都在。CI 上失败时把 trace 作为 artifact 上传，本地还原现场，五分钟能定位的选择器问题不要靠猜半小时。

## 什么值得 E2E，什么不值得

值得：首页到文章的路由、搜索命中并跳转、问答流渲染与引用链接、看板数据出现——这些是「拼装会坏」的地方。不值得：按钮 hover 变色、动画曲线、响应式断点的每个宽度——这些交给 Storybook 或人眼。E2E 的每一秒运行时间都花在刀刃上，套件才守得住。
