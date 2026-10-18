# Lumiracle 魔法少女主题设计规格

## 概述

将现有博客（宀·mian）改造为 **Lumiracle**（Lumi 光 + Miracle 奇迹），采用重度主题化的二次元光明系魔法少女风格。整个网站变成魔法世界的入口，晨曦暖阳与月夜魔法双模式切换。

## 设计决策记录

| 决策项 | 选择 | 备注 |
|--------|------|------|
| 网站名称 | Lumiracle | Lumi(光) + Miracle(奇迹) |
| 风格浓度 | 重度主题化 | 完全二次元沉浸体验 |
| 配色方案 | 琥珀晨曦（亮色）+ 月夜魔法（暗色） | 方案 A |
| 首页布局 | 星穹殿堂式 | 公告区+卡片网格+分类入口 |
| 组件装饰 | 光晕装饰系 | 光晕边框+底部光带，导航星标前缀 |
| 动画特效 | Motion + Canvas 混合 | UI 动画用 Motion 库，粒子/光尾用 Canvas |
| 角色元素 | 纯抽象魔法元素 | 星光、光芒、魔法阵，无角色形象 |
| 展示字体 | Cormorant Garamond | 标题、品牌名、装饰文字 |
| 代码字体 | Geist Mono（保留） | 代码块、等宽内容 |
| 导航当前页指示 | ✦ 星标前缀 | 替代下划线高亮 |

## 设计令牌

### 亮色模式 — 晨曦（Sunrise）

```css
:root {
  --background: #FFFBEB;       /* 暖白背景 */
  --foreground: #78350F;       /* 深棕文字 */
  --card: #FFFFFF;             /* 纯白卡片 */
  --card-foreground: #78350F;  /* 深棕卡片文字 */
  --muted: #FEF3C7;            /* 柔光背景 */
  --muted-foreground: #A16207; /* 柔光文字 */
  --border: #FDE68A;           /* 金色边框 */
  --accent: #F59E0B;           /* 琥珀金主色 */
  --accent-light: #FBBF24;     /* 浅金色 */
  --accent-bg: #FFFBEB;        /* 主色背景 */
  --accent-secondary: #F97316; /* 日落橙辅色 */
  --accent-rose: #E11D48;      /* 玫瑰红点缀 */
  --glow: rgba(245, 158, 11, 0.3);  /* 发光色 */
}
```

### 暗色模式 — 月夜（Moonnight）

```css
.dark {
  --background: #1E1B4B;       /* 深靛蓝背景 */
  --foreground: #E0E7FF;       /* 月光银文字 */
  --card: #312E81;             /* 靛紫卡片 */
  --card-foreground: #E0E7FF;  /* 月光银卡片文字 */
  --muted: #3730A3;            /* 柔光背景 */
  --muted-foreground: #A5B4FC; /* 柔光文字 */
  --border: #4338CA;           /* 靛蓝边框 */
  --accent: #FBBF24;           /* 萤火金主色 */
  --accent-light: #FCD34D;     /* 浅金色 */
  --accent-bg: #1E1B4B;        /* 主色背景 */
  --accent-secondary: #F59E0B; /* 琥珀金辅色 */
  --accent-rose: #F472B6;      /* 玫瑰粉点缀 */
  --glow: rgba(251, 191, 36, 0.3); /* 发光色 */
}
```

## 字体方案

| 用途 | 字体 | 来源 |
|------|------|------|
| 展示（标题、品牌名、装饰） | Cormorant Garamond | Google Fonts |
| 正文（UI 文字、段落） | System UI | 系统默认 |
| 代码 | Geist Mono | next/font（保留现有） |

Cormorant Garamond 通过 `next/font/google` 引入，设置 `variable: --font-cormorant`。

## 导航术语映射

| 原名称 | 魔法名称 | 路由 |
|--------|---------|------|
| 首页 | 星穹殿堂 | `/` |
| 分类 | 魔法书库 | `/categories/` |
| 归档 | 时光回廊 | `/archive/` |
| 日志 | 魔法记录 | `/changelog/` |
| 关于 | 守护者之室 | `/about/` |
| 搜索 | 魔法探知 | ⌘K 弹窗 |

导航栏当前页用 `✦` 星标前缀指示，而非下划线。

## 页面设计

### 首页 — 星穹殿堂

**布局**：星穹殿堂式（方案 A）

1. **Hero 区**：Canvas 粒子背景 + SVG 魔法阵装饰 + "Lumiracle" 标题（Cormorant 字体）+ 副标题"光之奇迹 · 记录与存档"
2. **星光公告区**：最新动态/公告卡片，光晕边框，左侧有 ✦ 图标
3. **文章卡片网格**：2 列网格，卡片使用光晕边框 + 底部渐变光带（琥珀金→日落橙→玫瑰红），悬浮时发光增强 + 光泽扫过效果
4. **魔法书库入口**：分类快速入口，3 列小卡片，悬浮光效

### 分类页 — 魔法书库

- Hero 区 + 分类卡片网格（3 列）
- 每个分类卡片有光晕边框和悬浮光效
- 图标用魔法书/卷轴风格替代 FolderOpen

### 归档页 — 时光回廊

- Hero 区 + 年份时间线
- 年份徽章用渐变发光圆形（琥珀金渐变）
- 时间线竖线用 SVG 魔法光束替代普通 border

### 更新日志 — 魔法记录

- Hero 区 + 版本时间线
- 类型标签用不同魔法色彩：新增（琥珀金）、优化（日落橙）、修复（玫瑰红）
- 版本号徽章发光

### 文章页 — 魔法书页

- 返回链接（"← 返回书卷列表"）
- 标题区：分类标签 + 标题 + 日期 + 阅读时间 + 描述 + 标签
- 魔法光束分隔线（SVG）替代 `<hr>`
- Markdown 内容区：typography 插件适配新配色
- 阅读进度条改为晨曦渐变光带

### 关于页 — 守护者之室

- Hero 区 + 联系信息卡片（光晕边框）
- 整体氛围更温馨

## 全局组件变更

### Header

- Logo：`✦ Lumiracle`（Cormorant 字体），替代 `PenTool + 宀·mian`
- 导航链接：当前页用 `✦ 前缀` 指示
- 底部：渐变光带（`linear-gradient(90deg, transparent, accent, accent-secondary, accent, transparent)`）
- 搜索按钮：魔法化样式，光晕边框
- 移动端菜单：同样使用魔法主题

### Footer

- 顶部：SVG 魔法装饰分隔线
- 统计信息用魔法术语：
  - "本页加载用时" → "魔法充能"
  - "访客数" → "星光造访"
  - "本站已稳定运行 X 天" → "本站已守护 X 天"

### ThemeToggle

- 图标：☀️/🌙 改为 `✦`/`☾`（SVG 魔法图标）
- 切换动画：旋转 + 发光过渡

### ScrollToTop

- 图标：ArrowUp 改为 SVG 魔法阵（同心圆 + 中心星标）
- 悬浮时：魔法阵旋转 + 发光
- 背景色：渐变发光（accent → accent-secondary）

### ReadingProgress

- 渐变光带：`linear-gradient(90deg, #F59E0B, #F97316, #E11D48)`（亮色）
- 暗色：`linear-gradient(90deg, #FBBF24, #F59E0B, #F472B6)`
- 高度：3px（保留）

### SearchDialog

- 搜索框：光晕边框
- 选中项：柔光高亮背景
- 快捷键提示：魔法主题样式

### PageTransition

- 改为魔法阵旋转 + 光之脉冲过渡动画
- 使用 Motion 的 `AnimatePresence` + `motion` 组件实现
- 过渡时长：0.5s

### 新增：ParticleCanvas

- Canvas 全屏粒子背景组件
- 亮色模式：琥珀金/日落橙/金色星光粒子，缓慢漂浮 + 闪烁
- 暗色模式：月光银/萤火金/靛蓝星光粒子，缓慢漂浮 + 闪烁
- 鼠标光尾：鼠标移动时留下渐隐光点轨迹
- 粒子数量：~50

## SVG 装饰元素

所有装饰性图形用 SVG 实现：

1. **魔法阵**：同心圆 + 旋转动画，用于 Hero 区装饰和过渡动画
2. **魔法光束**：渐变发光竖线，用于时间线和分隔线
3. **星光装饰**：四角星、六角星图案，用于卡片角落和标题装饰
4. **光晕边框**：CSS box-shadow 实现，SVG 用于更复杂的装饰
5. **渐变光带**：CSS linear-gradient 实现

## 动画规格

| 动画 | 实现方式 | 参数 |
|------|---------|------|
| 星光粒子背景 | Canvas | ~50 粒子，闪烁周期 2-4s |
| 鼠标光尾 | Canvas | 渐隐光点，生命周期 0.8s |
| 页面过渡 | Motion (AnimatePresence) | 魔法阵旋转 0.5s + 光脉冲 0.3s |
| 卡片悬浮光效 | Motion (whileHover) | scale + box-shadow 过渡 0.3s + 光泽扫过 0.6s |
| 卡片进入动画 | Motion (initial/animate) | 淡入上移，stagger 0.1s |
| 导航星标 | Motion | 淡入 0.2s |
| 主题切换 | Motion | 旋转 + 发光 0.3s |
| 返回顶部悬浮 | Motion (animate) | 魔法阵旋转 2s linear infinite |
| 阅读进度 | CSS | 宽度过渡 0.15s |

## 文件变更范围

### 修改的文件

| 文件 | 变更内容 |
|------|---------|
| `src/app/globals.css` | 全部重写：新配色令牌、动画关键帧、魔法装饰样式 |
| `src/app/layout.tsx` | 字体引入（Cormorant）、metadata 更新、ParticleCanvas 挂载 |
| `src/app/page.tsx` | 首页重构为星穹殿堂布局 |
| `src/app/about/page.tsx` | 魔法主题样式 |
| `src/app/archive/page.tsx` | 魔法主题样式 + SVG 光束时间线 |
| `src/app/categories/page.tsx` | 魔法主题样式 |
| `src/app/categories/[category]/page.tsx` | 魔法主题样式 |
| `src/app/changelog/page.tsx` | 魔法主题样式 + 魔法色彩标签 |
| `src/app/posts/[slug]/page.tsx` | 魔法主题样式 + SVG 分隔线 |
| `src/components/Header.tsx` | Logo、导航术语、星标指示、光带 |
| `src/components/Footer.tsx` | 魔法术语、装饰分隔线 |
| `src/components/ThemeToggle.tsx` | ✦/☾ 图标、旋转发光动画 |
| `src/components/ScrollToTop.tsx` | 魔法阵图标、旋转发光 |
| `src/components/ReadingProgress.tsx` | 渐变光带配色 |
| `src/components/SearchDialog.tsx` | 光晕边框、柔光高亮 |
| `src/components/PostCard.tsx` | 光晕边框、底部光带、悬浮光效 |
| `src/components/PageTransition.tsx` | 魔法阵过渡动画 |
| `src/lib/site-config.ts` | 站点名称等配置更新 |

### 新增的文件

| 文件 | 内容 |
|------|------|
| `src/components/ParticleCanvas.tsx` | Canvas 粒子背景 + 鼠标光尾组件 |
| `src/components/MagicDivider.tsx` | SVG 魔法光束分隔线组件 |
| `src/components/MagicCircle.tsx` | SVG 魔法阵组件（Hero 装饰 + 过渡动画用） |

## 约束与注意事项

1. **动画库**：引入 `motion`（原 Framer Motion）处理 UI 动画（页面过渡、悬浮、进入/退出、手势），Canvas 粒子效果用自定义实现
2. **性能**：Canvas 使用 requestAnimationFrame，粒子数量有上限；Motion 使用 LazyMotion 按需加载减小包体积
3. **可访问性**：动画尊重 `prefers-reduced-motion`（Motion 内置 `useReducedMotion`），在该设置下禁用粒子和过渡动画
4. **SEO**：metadata 中的站点名称和描述同步更新为 Lumiracle
5. **代码字体保留**：Geist Mono 用于代码块，不受主题变更影响
6. **未来托管**：项目将作为独立仓库托管在 GitHub 上
