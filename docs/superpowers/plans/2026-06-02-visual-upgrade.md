# Lumiracle 视觉升级 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将 Lumiracle 博客的魔法阵、粒子特效、页面布局和全局组件全面升级为更华丽的魔法少女主题风格。

**架构：** 以 SVG 组件替换魔法阵、Canvas API 升级粒子/鼠标特效、motion/react 实现页面过渡动画、Tailwind CSS 调整布局和卡片样式。所有变更在现有组件文件上修改或新建独立组件。

**技术栈：** Next.js 16 (App Router, static export), Tailwind CSS v4, motion/react (LazyMotion + domAnimation), Canvas API, SVG

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/components/MagicCircle.tsx` | 重写 | 新天使圣徽 SVG（主魔法阵） |
| `src/components/MagicCircleWings.tsx` | 新建 | 天使之翼 SVG（页面过渡用） |
| `src/components/ParticleCanvas.tsx` | 修改 | 光尘粒子拖尾 + 星尘鼠标轨迹 |
| `src/components/PostCard.tsx` | 修改 | 左侧光带卡样式 |
| `src/components/ScrollToTop.tsx` | 修改 | 星标按钮 |
| `src/components/Footer.tsx` | 修改 | 魔法光束分隔线 |
| `src/components/PageTransition.tsx` | 修改 | 天使之翼过渡动画 |
| `src/app/page.tsx` | 修改 | 左文右阵 Hero 布局 |
| `src/app/about/page.tsx` | 修改 | 左右分栏布局 |
| `src/app/changelog/page.tsx` | 修改 | 虚线光束 + 呼吸脉冲 |
| `src/app/archive/page.tsx` | 修改 | 渐变光束时间线 |
| `src/app/categories/page.tsx` | 修改 | 卡片左侧光带 |
| `src/app/globals.css` | 修改 | 新增动画关键帧和样式 |

---

### 任务 1：重写 MagicCircle 组件（新天使圣徽）

**文件：**
- 重写：`src/components/MagicCircle.tsx`

- [ ] **步骤 1：重写 MagicCircle.tsx**

将当前简单的4同心圆+星标替换为用户设计的新天使圣徽。保留相同的 props 接口（`size`, `className`, `animate`），替换 SVG 内容。

```tsx
'use client';

interface MagicCircleProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export default function MagicCircle({ size = 200, className = '', animate = true }: MagicCircleProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="1" />
          <stop offset="50%" stopColor="var(--accent-light)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="mc-grad-light" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-light)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.4" />
        </linearGradient>
        <radialGradient id="mc-grad-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent-light)" stopOpacity="1" />
          <stop offset="60%" stopColor="var(--accent)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 外圈双环 — 逆时针 30s */}
      <g style={animate ? { animation: 'mc-spin-ccw 30s linear infinite', transformOrigin: '100px 100px' } : undefined}>
        <circle cx="100" cy="100" r="95" stroke="url(#mc-grad)" strokeWidth="3" fill="none" />
        <circle cx="100" cy="100" r="90" stroke="url(#mc-grad-light)" strokeWidth="1" fill="none" />
      </g>

      {/* 第二层环 — 顺时针 25s */}
      <g style={animate ? { animation: 'mc-spin-cw 25s linear infinite', transformOrigin: '100px 100px' } : undefined}>
        <circle cx="100" cy="100" r="82" stroke="url(#mc-grad)" strokeWidth="2" fill="none" opacity="0.8" />
        <circle cx="100" cy="100" r="78" stroke="url(#mc-grad-light)" strokeWidth="1" fill="none" strokeDasharray="4 3" />
      </g>

      {/* 装饰光点 — 逆时针 18s */}
      <g style={animate ? { animation: 'mc-spin-ccw 18s linear infinite', transformOrigin: '100px 100px' } : undefined}>
        <g fill="var(--accent)">
          <circle cx="100" cy="10" r="5" />
          <circle cx="190" cy="100" r="5" />
          <circle cx="100" cy="190" r="5" />
          <circle cx="10" cy="100" r="5" />
        </g>
        <g fill="var(--accent-light)" opacity="0.9">
          <circle cx="163" cy="37" r="3" />
          <circle cx="163" cy="163" r="3" />
          <circle cx="37" cy="163" r="3" />
          <circle cx="37" cy="37" r="3" />
        </g>
      </g>

      {/* 第三层环 — 顺时针 8s */}
      <g style={animate ? { animation: 'mc-spin-cw 8s linear infinite', transformOrigin: '100px 100px' } : undefined}>
        <circle cx="100" cy="100" r="70" stroke="url(#mc-grad)" strokeWidth="1.5" fill="none" opacity="0.7" />
      </g>

      {/* 六芒星 — 呼吸脉冲 3s */}
      <g style={animate ? { animation: 'mc-pulse 3s ease-in-out infinite', transformOrigin: '100px 100px' } : undefined}>
        <polygon points="100,30 150,130 50,130" stroke="url(#mc-grad)" strokeWidth="2" fill="none" />
        <polygon points="100,170 50,70 150,70" stroke="url(#mc-grad)" strokeWidth="2" fill="none" />
      </g>

      {/* 第四层环 — 逆时针 10s */}
      <g style={animate ? { animation: 'mc-spin-ccw 10s linear infinite', transformOrigin: '100px 100px' } : undefined}>
        <circle cx="100" cy="100" r="55" stroke="url(#mc-grad)" strokeWidth="1.5" fill="none" />
        <circle cx="100" cy="100" r="48" stroke="url(#mc-grad-light)" strokeWidth="1" fill="none" strokeDasharray="3 4" />
      </g>

      {/* 中心圣光 */}
      <g>
        <circle cx="100" cy="100" r="25" fill="url(#mc-grad-core)" />
        <circle cx="100" cy="100" r="12" fill="var(--accent)" opacity="0.9" />
        <circle cx="100" cy="100" r="6" fill="var(--accent-light)" />
      </g>

      {/* 旋转符文 ❋ — 顺时针 25s */}
      <g style={animate ? { animation: 'mc-spin-cw 25s linear infinite', transformOrigin: '100px 100px' } : undefined}
        fill="var(--accent)" fontSize="8px" fontFamily="serif">
        <text x="100" y="42" textAnchor="middle" opacity="0.8">❋</text>
        <text x="158" y="103" textAnchor="middle" opacity="0.8">❋</text>
        <text x="100" y="164" textAnchor="middle" opacity="0.8">❋</text>
        <text x="42" y="103" textAnchor="middle" opacity="0.8">❋</text>
      </g>

      <style>{`
        @keyframes mc-spin-cw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes mc-spin-ccw {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes mc-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </svg>
  );
}
```

- [ ] **步骤 2：在 globals.css 中添加魔法阵动画关键帧**

在 `src/app/globals.css` 末尾追加：

```css
@keyframes mc-spin-cw {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes mc-spin-ccw {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

@keyframes mc-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}
```

注意：MagicCircle 组件内已通过 `<style>` 标签内联了这些关键帧，此步骤是为了确保 CSS 层面也有定义（防止组件未渲染时关键帧缺失）。如果组件内联足够则可跳过。

- [ ] **步骤 3：验证**

运行：`npm run build`
预期：构建成功，无类型错误。

---

### 任务 2：新建 MagicCircleWings 组件（天使之翼）

**文件：**
- 创建：`src/components/MagicCircleWings.tsx`

- [ ] **步骤 1：创建 MagicCircleWings.tsx**

```tsx
'use client';

interface MagicCircleWingsProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export default function MagicCircleWings({ size = 200, className = '', animate = true }: MagicCircleWingsProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mw-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-light)" stopOpacity="1" />
          <stop offset="50%" stopColor="var(--accent)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--accent-light)" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="mw-wing" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="50%" stopColor="var(--accent)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.3" />
        </linearGradient>
        <radialGradient id="mw-center" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent-light)" stopOpacity="1" />
          <stop offset="40%" stopColor="var(--accent-light)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 外圈 */}
      <g style={animate ? { animation: 'mc-spin-ccw 30s linear infinite', transformOrigin: '100px 100px' } : undefined}>
        <circle cx="100" cy="100" r="95" stroke="url(#mw-grad)" strokeWidth="2.5" fill="none" />
        <circle cx="100" cy="100" r="90" stroke="url(#mw-grad)" strokeWidth="1" fill="none" opacity="0.6" strokeDasharray="4 4" />
      </g>

      {/* 天使羽翼 */}
      <g>
        <g fill="url(#mw-wing)" opacity="0.7">
          {/* 左翼 */}
          <path d="M100 100 Q60 60 20 80 Q40 90 50 110 Q60 130 100 100" />
          <path d="M100 100 Q70 70 35 85 Q50 95 60 115 Q70 130 100 100" />
          <path d="M100 100 Q80 80 50 92 Q60 102 68 120 Q75 135 100 100" />
          {/* 右翼 */}
          <path d="M100 100 Q140 60 180 80 Q160 90 150 110 Q140 130 100 100" />
          <path d="M100 100 Q130 70 165 85 Q150 95 140 115 Q130 130 100 100" />
          <path d="M100 100 Q120 80 150 92 Q140 102 132 120 Q125 135 100 100" />
        </g>
      </g>

      {/* 光环 */}
      <g style={animate ? { animation: 'mc-spin-ccw 18s linear infinite', transformOrigin: '100px 100px' } : undefined}>
        <circle cx="100" cy="100" r="80" stroke="url(#mw-grad)" strokeWidth="1.5" fill="none" opacity="0.7" />
        <circle cx="100" cy="100" r="72" stroke="var(--accent)" strokeWidth="1" fill="none" strokeDasharray="3 5" />
      </g>

      {/* 六芒星 */}
      <g style={animate ? { animation: 'mc-pulse 3s ease-in-out infinite', transformOrigin: '100px 100px' } : undefined}>
        <polygon points="100,25 155,137.5 45,137.5" stroke="url(#mw-grad)" strokeWidth="1.5" fill="none" />
        <polygon points="100,175 45,62.5 155,62.5" stroke="url(#mw-grad)" strokeWidth="1.5" fill="none" />
      </g>

      {/* 内圈 */}
      <g style={animate ? { animation: 'mc-spin-cw 8s linear infinite', transformOrigin: '100px 100px' } : undefined}>
        <circle cx="100" cy="100" r="55" stroke="url(#mw-grad)" strokeWidth="1.5" fill="none" />
      </g>
      <g style={animate ? { animation: 'mc-spin-ccw 10s linear infinite', transformOrigin: '100px 100px' } : undefined}>
        <circle cx="100" cy="100" r="45" stroke="var(--accent)" strokeWidth="1" fill="none" opacity="0.8" />
      </g>

      {/* 中心圣光 */}
      <g>
        <circle cx="100" cy="100" r="30" fill="url(#mw-center)" />
        <circle cx="100" cy="100" r="18" fill="var(--accent)" opacity="0.8" />
        <circle cx="100" cy="100" r="10" fill="var(--accent-light)" />
      </g>

      {/* 装饰光点 */}
      <g style={animate ? { animation: 'mc-spin-cw 25s linear infinite', transformOrigin: '100px 100px' } : undefined}>
        <circle cx="100" cy="10" r="4" fill="var(--accent)" />
        <circle cx="190" cy="100" r="4" fill="var(--accent)" />
        <circle cx="100" cy="190" r="4" fill="var(--accent)" />
        <circle cx="10" cy="100" r="4" fill="var(--accent)" />
        <circle cx="160" cy="40" r="3" fill="var(--accent-light)" opacity="0.8" />
        <circle cx="160" cy="160" r="3" fill="var(--accent-light)" opacity="0.8" />
        <circle cx="40" cy="160" r="3" fill="var(--accent-light)" opacity="0.8" />
        <circle cx="40" cy="40" r="3" fill="var(--accent-light)" opacity="0.8" />
      </g>
    </svg>
  );
}
```

- [ ] **步骤 2：验证**

运行：`npm run build`
预期：构建成功。

---

### 任务 3：升级 ParticleCanvas（光尘粒子 + 星尘鼠标轨迹）

**文件：**
- 修改：`src/components/ParticleCanvas.tsx`

- [ ] **步骤 1：升级粒子为光尘形态（带拖尾和呼吸感）**

修改 `Particle` 接口，增加 `trail` 数组存储历史位置：

```tsx
interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  opacityDir: number;
  color: string;
  trail: { x: number; y: number }[];
}
```

修改 `createParticle` 函数：

```tsx
const createParticle = useCallback((width: number, height: number, colors: string[]): Particle => ({
  x: Math.random() * width,
  y: Math.random() * height,
  size: Math.random() * 2 + 1.5,
  speedX: (Math.random() - 0.5) * 0.3,
  speedY: (Math.random() - 0.5) * 0.3,
  opacity: Math.random() * 0.6 + 0.2,
  opacityDir: Math.random() > 0.5 ? 1 : -1,
  color: colors[Math.floor(Math.random() * colors.length)],
  trail: [],
}), []);
```

修改粒子绘制逻辑（在 `animate` 函数内替换粒子绘制部分）：

```tsx
for (const p of particlesRef.current) {
  // 保存历史位置（最多4帧）
  p.trail.push({ x: p.x, y: p.y });
  if (p.trail.length > 4) p.trail.shift();

  p.x += p.speedX;
  p.y += p.speedY;
  p.opacity += p.opacityDir * 0.005;
  if (p.opacity > 0.8 || p.opacity < 0.1) p.opacityDir *= -1;
  p.opacity = Math.max(0.1, Math.min(0.8, p.opacity));

  if (p.x < 0) p.x = canvas.width;
  if (p.x > canvas.width) p.x = 0;
  if (p.y < 0) p.y = canvas.height;
  if (p.y > canvas.height) p.y = 0;

  // 绘制拖尾
  for (let i = 0; i < p.trail.length; i++) {
    const t = p.trail[i];
    const trailAlpha = (i / p.trail.length) * p.opacity * 0.3;
    const trailSize = p.size * (i / p.trail.length) * 0.6;
    ctx.beginPath();
    ctx.arc(t.x, t.y, trailSize, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = trailAlpha;
    ctx.shadowBlur = 4;
    ctx.shadowColor = p.color;
    ctx.fill();
  }

  // 绘制粒子本体（带辉光）
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  ctx.fillStyle = p.color;
  ctx.globalAlpha = p.opacity;
  ctx.shadowBlur = 8;
  ctx.shadowColor = p.color;
  ctx.fill();
}
```

- [ ] **步骤 2：升级鼠标光尾为星尘轨迹**

修改 `TRAIL_LIFETIME` 为 `1000`，轨迹上限改为 `40`。

修改鼠标轨迹绘制逻辑，将圆点改为小星形：

```tsx
// 在 handleMouseMove 中
mouseRef.current.trails.push({
  x: e.clientX,
  y: e.clientY,
  born: Date.now(),
  color: trailColors[Math.floor(Math.random() * trailColors.length)],
});
if (mouseRef.current.trails.length > 40) {
  mouseRef.current.trails.shift();
}
```

添加散落粒子接口和逻辑：

```tsx
interface SparkleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  color: string;
  lifetime: number;
}
```

在 `mouseRef` 中增加 `sparkles` 数组：

```tsx
const mouseRef = useRef({
  x: -1000,
  y: -1000,
  trails: [] as { x: number; y: number; born: number; color: string }[],
  sparkles: [] as SparkleParticle[],
});
```

在 `handleMouseMove` 中添加散落粒子生成：

```tsx
// 每次鼠标移动产生1-2个散落粒子
if (Math.random() > 0.5) {
  mouseRef.current.sparkles.push({
    x: e.clientX,
    y: e.clientY,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    born: Date.now(),
    color: trailColors[Math.floor(Math.random() * trailColors.length)],
    lifetime: 600,
  });
}
```

添加绘制星形函数：

```tsx
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, points: number = 4) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? r : r * 0.4;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
```

修改轨迹绘制部分（替换原来的圆点绘制）：

```tsx
// 绘制鼠标轨迹（星尘）
for (const trail of mouseRef.current.trails) {
  const age = (now - trail.born) / TRAIL_LIFETIME;
  const alpha = 1 - age;
  const size = 3 * (1 - age);
  drawStar(ctx, trail.x, trail.y, size, 4);
  ctx.fillStyle = trail.color;
  ctx.globalAlpha = alpha * 0.6;
  ctx.shadowBlur = 12;
  ctx.shadowColor = trail.color;
  ctx.fill();
}

// 绘制散落粒子
mouseRef.current.sparkles = mouseRef.current.sparkles.filter(
  (s) => now - s.born < s.lifetime
);
for (const s of mouseRef.current.sparkles) {
  s.x += s.vx;
  s.y += s.vy;
  s.vy += 0.02; // 微重力
  const age = (now - s.born) / s.lifetime;
  const alpha = 1 - age;
  const size = 1.5 * (1 - age);
  drawStar(ctx, s.x, s.y, size, 4);
  ctx.fillStyle = s.color;
  ctx.globalAlpha = alpha * 0.4;
  ctx.shadowBlur = 6;
  ctx.shadowColor = s.color;
  ctx.fill();
}
```

- [ ] **步骤 3：验证**

运行：`npm run build`
预期：构建成功。

---

### 任务 4：修改 PostCard 为左侧光带卡

**文件：**
- 修改：`src/components/PostCard.tsx`

- [ ] **步骤 1：修改 PostCard 样式**

将 `<article>` 的 className 从：

```
glow-card bg-card rounded-xl overflow-hidden transition-all duration-300
```

改为：

```
bg-card border-l-[3px] border-l-accent rounded-r-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_12px_var(--glow)] hover:border-l-accent
```

同时移除 `glow-card` 类的依赖（因为左侧光带卡不再需要全边框光晕效果）。

完整修改后的 `<article>` 标签：

```tsx
<article
  className={`bg-card border-l-[3px] border-l-accent rounded-r-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_12px_var(--glow)] ${
    featured
      ? 'border-l-accent-secondary'
      : ''
  }`}
>
```

- [ ] **步骤 2：验证**

运行：`npm run build`
预期：构建成功。

---

### 任务 5：修改 ScrollToTop 为星标按钮

**文件：**
- 修改：`src/components/ScrollToTop.tsx`

- [ ] **步骤 1：替换魔法阵图标为星标**

移除 `MagicCircle` 导入，将按钮内容从 `<MagicCircle size={20} animate={false} className="opacity-80" />` 改为星标文字 `✦`。

完整修改后的组件：

```tsx
'use client';

import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'motion/react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <m.button
          type="button"
          onClick={scrollToTop}
          aria-label="返回顶部"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-8 right-8 z-50 w-11 h-11 rounded-full bg-gradient-to-br from-accent to-accent-secondary text-white shadow-lg flex items-center justify-center hover:shadow-[0_0_20px_var(--glow)] transition-shadow text-lg font-bold"
        >
          ✦
        </m.button>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **步骤 2：验证**

运行：`npm run build`
预期：构建成功。

---

### 任务 6：修改 Footer 为魔法光束分隔线

**文件：**
- 修改：`src/components/Footer.tsx`

- [ ] **步骤 1：替换 border-t 为 MagicDivider**

导入 `MagicDivider`，将 `<footer>` 的 `border-t border-border/50` 替换为在 footer 内容上方放置 `MagicDivider`。

完整修改后的组件：

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { SITE_BIRTH_DATE, FOOTER_LABELS } from '@/lib/site-config';
import MagicDivider from './MagicDivider';

function calcRunningDays(): number {
  return Math.floor((Date.now() - SITE_BIRTH_DATE.getTime()) / 86400000);
}

export default function Footer() {
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [runningDays] = useState(calcRunningDays);
  const pathname = usePathname();
  const prevPathnameRef = useRef<string>(pathname);

  useEffect(() => {
    const isNewRoute = prevPathnameRef.current !== pathname;
    prevPathnameRef.current = pathname;
    if (!isNewRoute) return;

    const startMark = `route-start-${pathname}`;
    const endMark = `route-end-${pathname}`;
    const measureName = `route-duration-${pathname}`;

    performance.mark(startMark);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        performance.mark(endMark);
        try {
          performance.measure(measureName, startMark, endMark);
          const entries = performance.getEntriesByName(measureName);
          if (entries.length > 0) {
            setLoadTime(Math.round(entries[entries.length - 1].duration));
          }
        } catch {
          const markEntry = performance.getEntriesByName(startMark)[0];
          setLoadTime(markEntry ? Math.round(performance.now() - markEntry.startTime) : 0);
        }
        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures(measureName);
      });
    });
  }, [pathname]);

  useEffect(() => {
    const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (nav && nav.domContentLoadedEventEnd > 0) {
      setLoadTime(Math.round(nav.domContentLoadedEventEnd - nav.fetchStart));
    }
  }, []);

  return (
    <footer className="bg-transparent mt-auto transition-colors relative z-10">
      <MagicDivider className="my-0" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-center text-sm text-muted-foreground leading-relaxed">
          <span>{FOOTER_LABELS.loadTime}：<span className="text-foreground font-medium">{loadTime ?? '--'}</span> ms</span>
          <span className="mx-2 text-border">·</span>
          <span>{FOOTER_LABELS.runningDays} <span className="text-foreground font-medium">{runningDays}</span> 天</span>
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **步骤 2：验证**

运行：`npm run build`
预期：构建成功。

---

### 任务 7：修改 PageTransition 为天使之翼过渡

**文件：**
- 修改：`src/components/PageTransition.tsx`

- [ ] **步骤 1：添加天使之翼魔法阵过渡效果**

导入 `MagicCircleWings`，在退出动画时显示天使之翼魔法阵。

```tsx
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { m, AnimatePresence } from 'motion/react';
import MagicCircleWings from './MagicCircleWings';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showWings, setShowWings] = useState(false);

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => setShowWings(false)}
    >
      <m.div
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onExitStart={() => setShowWings(true)}
      >
        {children}
      </m.div>
      {/* 天使之翼过渡覆盖层 */}
      <AnimatePresence>
        {showWings && (
          <m.div
            className="fixed inset-0 z-[9998] pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.3, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <MagicCircleWings size={400} animate={false} />
          </m.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
```

注意：`onExitStart` 不是 motion/react 的标准 API。实际实现需要用 `useEffect` 监听 pathname 变化来触发翅膀显示。简化方案如下：

```tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { m, AnimatePresence } from 'motion/react';
import MagicCircleWings from './MagicCircleWings';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showWings, setShowWings] = useState(false);

  useEffect(() => {
    setShowWings(true);
    const timer = setTimeout(() => setShowWings(false), 600);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      <AnimatePresence mode="wait">
        <m.div
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {children}
        </m.div>
      </AnimatePresence>
      {/* 天使之翼过渡覆盖层 */}
      <AnimatePresence>
        {showWings && (
          <m.div
            className="fixed inset-0 z-[9998] pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.25, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <MagicCircleWings size={400} animate={false} />
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **步骤 2：验证**

运行：`npm run build`
预期：构建成功。

---

### 任务 8：修改首页为左文右阵 Hero 布局

**文件：**
- 修改：`src/app/page.tsx`

- [ ] **步骤 1：重构 Hero 区域为左文右阵**

将当前居中布局改为 flex 左文右阵布局。修改 `page.tsx` 中的 Hero section：

```tsx
<section className="bg-transparent py-32 px-4 relative overflow-hidden">
  <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12 relative">
    {/* 左侧文字区 */}
    <div className="flex-1 text-center md:text-left">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium mb-6">
        <Sparkles className="w-4 h-4" />欢迎来到星穹殿堂
      </div>
      <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 font-[family-name:var(--font-cormorant)]">
        {SITE_NAME}
      </h1>
      <p className="text-xl text-muted-foreground mb-8">
        {SITE_SUBTITLE} · 记录与存档
      </p>
      <Link href="/categories/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-accent-secondary text-white rounded-lg font-medium shadow-lg hover:shadow-[0_0_20px_var(--glow)] transition-shadow">
        探索魔法书库 →
      </Link>
    </div>
    {/* 右侧魔法阵 */}
    <div className="flex-shrink-0 opacity-80">
      <MagicCircle size={350} />
    </div>
  </div>
</section>
```

注意：需要确保 `Link` 已从 `next/link` 导入（当前文件已有导入）。

- [ ] **步骤 2：验证**

运行：`npm run build`
预期：构建成功。

---

### 任务 9：修改关于页为左右分栏布局

**文件：**
- 修改：`src/app/about/page.tsx`

- [ ] **步骤 1：重构为左右分栏布局**

```tsx
import { Mail, Globe } from 'lucide-react';
import MagicDivider from '@/components/MagicDivider';

export default function AboutPage() {
  return (
    <div className="relative z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium mb-6">
            ✦ 守护者之室
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-6 font-[family-name:var(--font-cormorant)]">关于本站</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* 左侧 60% 个人信息 */}
          <div className="md:w-[60%]">
            <p className="text-lg text-muted-foreground mb-6">在这里记录日常感悟。</p>
            <p className="text-muted-foreground mb-8">收集灵光与碎片，编织成记忆的星河。</p>
            <MagicDivider />
          </div>

          {/* 右侧 40% 联系卡片 */}
          <div className="md:w-[40%]">
            <div className="glow-card bg-card rounded-xl p-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">联系我</h2>
              <div className="space-y-3">
                <a href="mailto:oo4272601@gmail.com"
                  className="flex items-center gap-3 text-muted-foreground hover:text-accent transition-colors">
                  <Mail className="w-5 h-5" /><span>oo4272601@gmail.com</span>
                </a>
                <a href="https://github.com/what-s-more" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 text-muted-foreground hover:text-accent transition-colors">
                  <Globe className="w-5 h-5" /><span>GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **步骤 2：验证**

运行：`npm run build`
预期：构建成功。

---

### 任务 10：修改归档页为渐变光束时间线

**文件：**
- 修改：`src/app/archive/page.tsx`

- [ ] **步骤 1：将时间线竖线改为渐变光束**

将 `border-l-2 border-accent/20` 改为渐变光束样式。在 `globals.css` 中添加：

```css
.timeline-beam {
  border: none;
  position: relative;
}

.timeline-beam::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, var(--accent), var(--accent-secondary), var(--accent));
  opacity: 0.5;
  box-shadow: 0 0 6px var(--glow);
}
```

在 `archive/page.tsx` 中，将：

```tsx
<div className="ml-7 border-l-2 border-accent/20 pl-8 space-y-4">
```

改为：

```tsx
<div className="ml-7 timeline-beam pl-8 space-y-4">
```

同时将年份标签增加光晕效果，将年份 div 的 `shadow-[0_0_12px_var(--glow)]` 改为 `shadow-[0_0_20px_var(--glow)]`。

- [ ] **步骤 2：验证**

运行：`npm run build`
预期：构建成功。

---

### 任务 11：修改更新记录页为虚线光束 + 呼吸脉冲

**文件：**
- 修改：`src/app/changelog/page.tsx`

- [ ] **步骤 1：将竖线改为虚线光束，版本号增加呼吸脉冲**

在 `globals.css` 中添加：

```css
.timeline-dashed-beam {
  border: none;
  position: relative;
}

.timeline-dashed-beam::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: repeating-linear-gradient(
    to bottom,
    var(--accent) 0px,
    var(--accent) 6px,
    transparent 6px,
    transparent 12px
  );
  opacity: 0.4;
  box-shadow: 0 0 4px var(--glow);
}

@keyframes breathe {
  0%, 100% { box-shadow: 0 0 8px var(--glow); }
  50% { box-shadow: 0 0 20px var(--glow), 0 0 40px var(--glow); }
}

.version-badge-pulse {
  animation: breathe 3s ease-in-out infinite;
}
```

在 `changelog/page.tsx` 中，将：

```tsx
<div className="ml-7 border-l-2 border-accent/20 pl-8">
```

改为：

```tsx
<div className="ml-7 timeline-dashed-beam pl-8">
```

将版本号 div 的 `shadow-[0_0_12px_var(--glow)]` 改为 `version-badge-pulse`：

```tsx
<div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-accent-secondary text-white flex items-center justify-center text-lg font-bold shrink-0 version-badge-pulse">
```

- [ ] **步骤 2：验证**

运行：`npm run build`
预期：构建成功。

---

### 任务 12：修改分类页卡片为左侧光带样式

**文件：**
- 修改：`src/app/categories/page.tsx`

- [ ] **步骤 1：给分类卡片添加左侧光带**

将分类卡片的 Link className 从：

```
group block p-6 bg-card rounded-xl border border-border shadow-sm hover:shadow-[0_0_16px_var(--glow)] hover:border-accent/50 transition-all duration-300
```

改为：

```
group block p-6 bg-card border-l-[3px] border-l-accent rounded-r-xl shadow-sm hover:shadow-[0_0_12px_var(--glow)] transition-all duration-300
```

- [ ] **步骤 2：验证**

运行：`npm run build`
预期：构建成功。

---

### 任务 13：更新 globals.css 样式

**文件：**
- 修改：`src/app/globals.css`

- [ ] **步骤 1：添加所有新增的 CSS 类和动画**

在 `globals.css` 末尾追加：

```css
/* 时间线渐变光束 */
.timeline-beam {
  border: none;
  position: relative;
}

.timeline-beam::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, var(--accent), var(--accent-secondary), var(--accent));
  opacity: 0.5;
  box-shadow: 0 0 6px var(--glow);
}

/* 时间线虚线光束 */
.timeline-dashed-beam {
  border: none;
  position: relative;
}

.timeline-dashed-beam::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: repeating-linear-gradient(
    to bottom,
    var(--accent) 0px,
    var(--accent) 6px,
    transparent 6px,
    transparent 12px
  );
  opacity: 0.4;
  box-shadow: 0 0 4px var(--glow);
}

/* 版本号呼吸脉冲 */
@keyframes breathe {
  0%, 100% { box-shadow: 0 0 8px var(--glow); }
  50% { box-shadow: 0 0 20px var(--glow), 0 0 40px var(--glow); }
}

.version-badge-pulse {
  animation: breathe 3s ease-in-out infinite;
}
```

- [ ] **步骤 2：最终构建验证**

运行：`npm run build`
预期：构建成功，所有页面正常渲染。

- [ ] **步骤 3：开发服务器验证**

运行：`npm run dev`
预期：开发服务器启动，浏览器中可查看所有变更效果。
