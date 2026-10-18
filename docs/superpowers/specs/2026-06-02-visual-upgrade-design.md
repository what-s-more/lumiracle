# Lumiracle 视觉升级设计规格

日期: 2026-06-02

## 概述

对 Lumiracle 博客进行视觉全面升级，涵盖魔法阵、特效、布局和全局组件四个维度。目标是让网站从"素净"升级为"华丽但不浮夸"的魔法少女主题。

## 1. 魔法阵升级

### 1.1 主魔法阵：新天使圣徽

替换当前简单的4同心圆+星标魔法阵，采用用户自设计的"新天使圣徽"方案。

SVG 结构（viewBox 0 0 200 200）：
- **外圈双环**：r=95 stroke-width=3 + r=90 stroke-width=1，逆时针旋转
- **第二层环**：r=82 stroke-width=2 + r=78 虚线 stroke-dasharray="4 3"，顺时针旋转
- **装饰光点**：4个大光点（r=5）在十字方位 + 4个小光点（r=3）在对角方位，逆时针中速旋转
- **第三层环**：r=70 stroke-width=1.5，顺时针快速旋转
- **六芒星**：两个等边三角形叠加（向上三角形 points="100,30 150,130 50,130"，向下三角形 points="100,170 50,70 150,70"），带呼吸脉冲动画
- **第四层环**：r=55 stroke-width=1.5 + r=48 虚线 stroke-dasharray="3 4"，逆时针快速旋转
- **中心圣光**：r=25 径向渐变光球 + r=12 金色实心 + r=6 白色实心
- **旋转符文**：4个❋符号沿r=82环分布，顺时针旋转

渐变定义：
- `holy5`：#ffd700 → #fff → #ffd700 线性渐变
- `holy5-light`：#fff8dc(0.8) → #ffd700(0.4) 线性渐变
- `holy5-core`：#fff → #ffd700(0.8) → #ffd700(0) 径向渐变

动画配置：
- 外圈：逆时针 30s
- 第二层环：顺时针 25s
- 装饰光点：逆时针 18s
- 第三层环：顺时针 8s
- 六芒星：呼吸脉冲 3s ease-in-out
- 第四层环：逆时针 10s
- 符文：顺时针 25s

颜色适配：
- 亮色模式：使用 CSS 变量 `var(--accent)` / `var(--accent-secondary)` / `var(--accent-light)` 替代硬编码金色
- 暗色模式：自动跟随 CSS 变量切换

### 1.2 页面过渡魔法阵：天使之翼

用于页面切换过渡动画。

SVG 结构（viewBox 0 0 200 200）：
- **外圈**：r=95 stroke-width=2.5 + r=90 虚线
- **天使羽翼**：6条贝塞尔曲线路径（左3+右3），填充渐变
- **光环**：r=80 + r=72 虚线
- **六芒星**：两个等边三角形
- **内圈**：r=55 + r=45
- **中心圣光**：r=30 径向渐变 + r=18 金色 + r=10 白色
- **装饰光点**：4大+4小

动画：整体淡入→旋转→淡出，持续约 0.6s

## 2. 特效升级（光尘飘落系）

### 2.1 粒子背景升级

当前：50个简单圆点随机飘浮
升级为：
- 粒子形态：从纯圆改为带辉光的光点，使用 `shadowBlur` + `shadowColor` 增强发光感
- 拖尾效果：每个粒子保留最近3-5帧位置，绘制渐隐拖尾
- 呼吸感：粒子大小随 opacity 同步脉动（1.5-3px 范围）
- 数量：保持 50 个，避免性能问题
- 颜色：亮色 [#F59E0B, #FBBF24, #F97316, #FDE68A]，暗色 [#C4B5FD, #E0E7FF, #FBBF24, #A5B4FC]

### 2.2 鼠标光尾升级

当前：简单圆点轨迹，30个点，800ms 生命周期
升级为：
- 星尘轨迹：每个轨迹点绘制为小星形（4角或6角）而非圆点
- 散落粒子：鼠标移动时额外产生 1-2 个微小散落粒子，向随机方向漂移后消失
- 拖尾更长：轨迹点增加到 40 个，生命周期延长到 1000ms
- 辉光更强：`shadowBlur` 从 8 增加到 12

### 2.3 页面过渡效果

当前：简单 fadeInUp（opacity + translateY）
升级为：
- 退出：当前页面向上淡出 + 天使之翼魔法阵从中心缩放淡入
- 进入：天使之翼魔法阵缩放淡出 + 新页面从下方淡入
- 持续时间：0.6s
- 使用 motion/react 的 AnimatePresence + m.div 实现

## 3. 首页 Hero 区（左文右阵式）

当前：魔法阵居中半透明背景 + 标题叠上方
升级为：

```
┌─────────────────────────────────────────┐
│                                         │
│  ✦ 欢迎来到星穹殿堂                      │
│  Lumiracle                    [魔法阵]   │
│  光之奇迹 · 记录与存档                   │
│  [探索魔法书库 →]                        │
│                                         │
└─────────────────────────────────────────┘
```

- 左侧（flex-1）：欢迎标签 + 大标题 + 副标题 + CTA 按钮
- 右侧（flex-shrink-0）：新天使圣徽魔法阵，尺寸约 300-400px
- CTA 按钮：渐变背景（accent → accent-secondary），圆角，hover 时发光
- 响应式：移动端改为上下排列（文字在上，魔法阵在下，尺寸缩小）

## 4. 文章卡片（左侧光带卡）

当前：白底圆角矩形 + 全边框 + 底部信息
升级为：
- **左侧光带**：3px 实线金色边框（`border-left: 3px solid var(--accent)`）
- **圆角**：仅右侧圆角（`border-radius: 0 12px 12px 0`）
- **hover 效果**：左侧光带 `box-shadow` 发光扩散（`0 0 12px var(--glow)`）
- **其他**：保持当前内部布局不变（分类标签、标题、描述、日期、阅读链接）

## 5. 子页面布局（装饰差异化）

保持统一的"顶部标题区 + 内容区"结构，通过装饰元素区分：

- **分类页**：卡片网格（当前已有），卡片增加左侧光带样式（与文章卡片一致）
- **归档页**：时间线左侧竖线改为渐变光束（从 accent 到 accent-secondary），年份标签增加光晕
- **更新记录页**：版本号标签增加呼吸脉冲动画，竖线改为虚线光束
- **关于页**：左右分栏布局（左侧 60% 个人信息 + 右侧 40% 联系卡片），中间用魔法光束分隔线

## 6. 全局组件

### 6.1 导航栏
- 背景：`bg-background/80 backdrop-blur-md`（保持当前）
- 底部渐变线：保持当前 `gradient-header-bar`
- 星标装饰：当前页星标前缀 ✦（保持当前）
- 变更：搜索按钮文案"魔法探知"保持，kbd 样式保持

### 6.2 页脚
- 背景：`bg-transparent`（保持当前）
- 分隔线：从 `border-t border-border/50` 改为魔法光束分隔线（复用 MagicDivider 的 SVG 样式，简化版）
- 内容：保持当前的加载时间 + 运行天数

### 6.3 返回顶部
- 当前：圆形渐变按钮 + 小魔法阵图标
- 升级：星标（✦）按钮，圆形，渐变背景，hover 时发光（`shadow-[0_0_20px_var(--glow)]`）
- 移除 MagicCircle 依赖

### 6.4 页面过渡
- 见 2.3 节

## 7. 技术约束

- Next.js 16 App Router，静态导出模式（`output: 'export'`）
- Tailwind CSS v4 语法
- motion/react 动画库（LazyMotion + domAnimation）
- Canvas API 用于粒子背景和鼠标光尾
- 所有动画需尊重 `prefers-reduced-motion`
- 魔法阵 SVG 使用 CSS 变量适配亮/暗色模式

## 8. 文件变更预估

| 文件 | 变更类型 |
|------|---------|
| `src/components/MagicCircle.tsx` | 重写 — 新天使圣徽 SVG |
| `src/components/MagicCircleWings.tsx` | 新建 — 天使之翼魔法阵 |
| `src/components/ParticleCanvas.tsx` | 修改 — 粒子拖尾 + 星尘鼠标轨迹 |
| `src/components/PostCard.tsx` | 修改 — 左侧光带样式 |
| `src/components/ScrollToTop.tsx` | 修改 — 星标按钮 |
| `src/components/Footer.tsx` | 修改 — 魔法光束分隔线 |
| `src/components/PageTransition.tsx` | 修改 — 天使之翼过渡 |
| `src/components/MagicDivider.tsx` | 保持（复用于页脚） |
| `src/app/page.tsx` | 修改 — 左文右阵 Hero 布局 |
| `src/app/about/page.tsx` | 修改 — 左右分栏布局 |
| `src/app/changelog/page.tsx` | 修改 — 装饰差异化 |
| `src/app/archive/page.tsx` | 修改 — 光束时间线 |
| `src/app/categories/page.tsx` | 修改 — 卡片光带样式 |
| `src/app/globals.css` | 修改 — 新增动画关键帧和样式 |
