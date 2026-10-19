---
title: "Tailwind CSS 4：CSS 变量与设计令牌的新玩法"
date: "2026-05-04"
description: "Tailwind 4 的 CSS-first 配置、@theme 指令与设计令牌实践——从 theme() 函数到原生 CSS 变量的迁移"
category: "Notes"
tags: ["tailwindcss", "css", "design-tokens", "styling"]
---

# Tailwind CSS 4：CSS 变量与设计令牌的新玩法

Tailwind 4 把配置从 JS 搬回了 CSS：不再有 `tailwind.config.js`，主题定义直接写在样式表里。迁移成本不高，但思路变化值得专门说一次。

## @theme 指令

```css
@import "tailwindcss";

@theme {
  --color-accent: oklch(0.7 0.15 250);
  --color-card: oklch(0.98 0.01 250);
  --font-display: "Georgia", serif;
}
```

`@theme` 里定义的变量自动生成对应工具类：`--color-accent` 产出 `text-accent`、`bg-accent`、`border-accent` 全家桶。设计令牌的「定义」与「消费」在同一份 CSS 里完成，不再需要在 JS 配置和 CSS 之间跳。

## 运行时主题切换

设计令牌一旦是 CSS 变量，切换主题就只是换变量值：

```css
:root {
  --accent: oklch(0.7 0.15 250);
}
[data-theme='dark'] {
  --accent: oklch(0.75 0.13 250);
}
```

组件里的 `bg-accent` 一个字都不用改，暗色模式自动生效。这个性质让 CSS 变量成为主题系统的正确底座——用 Tailwind 3 的固定色值时，每个颜色都要写 `dark:` 前缀变体；用变量后，`dark:` 变体的数量从「每个颜色」降到「每层根容器一个」。

## @apply 的克制使用

`@apply` 把工具类搬进自定义 CSS，适合「重复出现的三件套」：

```css
.card {
  @apply bg-card border rounded-lg p-4;
}
```

但 `@apply` 链条一长就变成「用类名写的普通 CSS」，失去了工具类内联的直观。经验值：同一个样式组合出现在三个以上组件里才抽成 `@apply`，否则直接内联。抽象的成本永远真实存在。

## oklch 与感知均匀

Tailwind 4 默认推荐 oklch 色彩空间。它的实用价值是「感知均匀」：`oklch(0.7 0.15 250)` 和 `oklch(0.7 0.15 30)` 亮度饱和度完全一致，只有色相不同——直接换色相数字就能得到同明度的另一个主题色。这解释了为什么暗色模式适配时 oklch 方案的微调量远小于 hex 方案：改 L（亮度）一个维度就够了。

## 与 arbitrary value 的关系

```html
<div class="w-[calc(100%-2rem)]">
```

方括号任意值适合一次性样式。判断标准：这个值出现第二次吗？是，就进 `@theme` 变成令牌；否，就地写方括号。令牌化是有成本的（命名、查找），一次性样式不值得付这个成本。

## 迁移检查单

从 3 升 4 的实际步骤：全局安装 `@tailwindcss/postcss` 替换旧 postcss 插件；`tailwind.config.js` 里的 theme 扩展逐项搬进 `@theme`；`content` 配置删除（4 自动扫描）；自定义颜色从 hex 改成 oklch（可选但推荐）。本站迁移踩过的唯一坑是 PostCSS 插件顺序——`@tailwindcss/postcss` 必须在 typography 插件之前。
