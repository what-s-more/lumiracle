# Lumiracle 魔法少女主题 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将现有博客从"宀·mian"商务风改造为"Lumiracle"二次元光明系魔法少女主题，琥珀晨曦+月夜魔法双模式。

**架构：** 基于现有 Next.js 16 + Tailwind CSS 4 项目，替换全部设计令牌和组件样式，引入 Motion 动画库处理 UI 动画，新增 Canvas 粒子背景组件，新增 SVG 魔法装饰组件。

**技术栈：** Next.js 16, Tailwind CSS 4, TypeScript, Motion (原 Framer Motion), Canvas API, SVG

---

## 文件结构

### 新增文件

| 文件 | 职责 |
|------|------|
| `src/components/ParticleCanvas.tsx` | Canvas 全屏粒子背景 + 鼠标光尾，亮色用琥珀金粒子，暗色用月光银粒子 |
| `src/components/MagicDivider.tsx` | SVG 魔法光束分隔线，替代 `<hr>`，用于文章页和页面内分隔 |
| `src/components/MagicCircle.tsx` | SVG 魔法阵组件，用于 Hero 区装饰和过渡动画 |

### 修改文件

| 文件 | 职责 |
|------|------|
| `src/lib/site-config.ts` | 站点配置：名称、描述等 |
| `src/app/globals.css` | 设计令牌、动画关键帧、魔法装饰样式 |
| `src/app/layout.tsx` | 字体引入（Cormorant）、metadata、ParticleCanvas 挂载、Motion 的 LazyMotion |
| `src/components/ThemeProvider.tsx` | 无需修改（主题逻辑不变） |
| `src/components/ThemeToggle.tsx` | ✦/☾ 图标、Motion 旋转发光动画 |
| `src/components/Header.tsx` | Logo 改为 ✦ Lumiracle、导航术语、星标前缀、渐变光带 |
| `src/components/Footer.tsx` | 魔法术语、装饰分隔线 |
| `src/components/ScrollToTop.tsx` | 魔法阵图标、Motion 旋转发光 |
| `src/components/ReadingProgress.tsx` | 晨曦渐变光带配色 |
| `src/components/SearchDialog.tsx` | 光晕边框、柔光高亮、魔法主题 |
| `src/components/PostCard.tsx` | 光晕边框、底部光带、Motion 悬浮/进入动画 |
| `src/components/PageTransition.tsx` | Motion AnimatePresence 过渡 |
| `src/components/MarkdownRenderer.tsx` | typography 适配新配色 |
| `src/app/page.tsx` | 首页重构为星穹殿堂布局 |
| `src/app/categories/page.tsx` | 魔法主题样式 |
| `src/app/categories/[category]/page.tsx` | 魔法主题样式 |
| `src/app/archive/page.tsx` | 魔法主题 + SVG 光束时间线 |
| `src/app/changelog/page.tsx` | 魔法主题 + 魔法色彩标签 |
| `src/app/posts/[slug]/page.tsx` | 魔法主题 + SVG 分隔线 |
| `src/app/about/page.tsx` | 魔法主题样式 |

---

## 任务 1：基础设施 — 安装依赖 + 更新站点配置

**文件：**
- 修改：`src/lib/site-config.ts`
- 修改：`package.json`（通过 npm install）

- [ ] **步骤 1：安装 motion 库**

```bash
npm install motion
```

- [ ] **步骤 2：更新 site-config.ts**

将 `src/lib/site-config.ts` 全部替换为：

```ts
export const SITE_BIRTH_DATE = new Date('2026-05-24');
export const VISITOR_PAGE_ID = 'nextjs-blog';
export const SITE_NAME = 'Lumiracle';
export const SITE_DESCRIPTION = '光之奇迹 · 记录与存档';
export const SITE_SUBTITLE = '光之奇迹';

export const NAV_LINKS = [
  { href: '/', label: '星穹殿堂' },
  { href: '/categories/', label: '魔法书库' },
  { href: '/archive/', label: '时光回廊' },
  { href: '/changelog/', label: '魔法记录' },
  { href: '/about/', label: '守护者之室' },
] as const;

export const FOOTER_LABELS = {
  loadTime: '魔法充能',
  visitors: '星光造访',
  runningDays: '本站已守护',
} as const;
```

- [ ] **步骤 3：验证安装成功**

```bash
npx tsc --noEmit
```

预期：无错误

- [ ] **步骤 4：Commit**

```bash
git add -A
git commit -m "feat: install motion + update site config for Lumiracle"
```

---

## 任务 2：设计令牌 — 重写 globals.css

**文件：**
- 修改：`src/app/globals.css`

- [ ] **步骤 1：重写 globals.css**

将 `src/app/globals.css` 全部替换为：

```css
@import "tailwindcss";

@plugin "@tailwindcss/typography";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: #FFFBEB;
  --foreground: #78350F;
  --card: #FFFFFF;
  --card-foreground: #78350F;
  --muted: #FEF3C7;
  --muted-foreground: #A16207;
  --border: #FDE68A;
  --accent: #F59E0B;
  --accent-light: #FBBF24;
  --accent-bg: #FFFBEB;
  --accent-secondary: #F97316;
  --accent-rose: #E11D48;
  --glow: rgba(245, 158, 11, 0.3);
}

.dark {
  --background: #1E1B4B;
  --foreground: #E0E7FF;
  --card: #312E81;
  --card-foreground: #E0E7FF;
  --muted: #3730A3;
  --muted-foreground: #A5B4FC;
  --border: #4338CA;
  --accent: #FBBF24;
  --accent-light: #FCD34D;
  --accent-bg: #1E1B4B;
  --accent-secondary: #F59E0B;
  --accent-rose: #F472B6;
  --glow: rgba(251, 191, 36, 0.3);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-accent: var(--accent);
  --color-accent-light: var(--accent-light);
  --color-accent-bg: var(--accent-bg);
  --color-accent-secondary: var(--accent-secondary);
  --color-accent-rose: var(--accent-rose);
  --color-glow: var(--glow);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --font-display: var(--font-cormorant);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-transition {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.glow-card {
  border: 2px solid var(--border);
  box-shadow: 0 0 16px var(--glow), 0 0 4px var(--glow);
  position: relative;
  overflow: hidden;
}

.glow-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.08), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.glow-card:hover::after {
  transform: translateX(100%);
}

.glow-card:hover {
  box-shadow: 0 0 24px var(--glow), 0 0 8px var(--glow);
  border-color: var(--accent);
}

.gradient-light-bar {
  height: 3px;
  background: linear-gradient(90deg, #F59E0B, #F97316, #E11D48);
  opacity: 0.6;
}

.dark .gradient-light-bar {
  background: linear-gradient(90deg, #FBBF24, #F59E0B, #F472B6);
}

.gradient-header-bar {
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent), var(--accent-secondary), var(--accent), transparent);
}

.magic-badge {
  background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
  color: white;
  box-shadow: 0 0 12px var(--glow);
}

pre > code {
  display: grid;
  font-size: 0.875rem;
  line-height: 1.7;
  background-color: transparent !important;
  padding: 0 !important;
}

pre > code > [data-line] {
  padding: 0 1rem;
  border-left: 3px solid transparent;
}

pre > code > [data-highlighted-line] {
  background: rgba(245, 158, 11, 0.15);
  border-left-color: #F59E0B;
}

.dark pre > code > [data-highlighted-line] {
  background: rgba(251, 191, 36, 0.15);
  border-left-color: #FBBF24;
}

code [data-line-numbers] {
  counter-reset: line;
}

code [data-line-numbers] > [data-line]::before {
  counter-increment: line;
  content: counter(line);
  display: inline-block;
  width: 1.5rem;
  margin-right: 1rem;
  text-align: right;
  color: rgba(156, 163, 175, 0.5);
  font-size: 0.75rem;
}

pre [datafilename] {
  display: block;
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  color: #9ca3af;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
}
```

- [ ] **步骤 2：验证构建**

```bash
npx next build
```

预期：构建成功（可能有颜色相关的 class 警告，但不应有错误）

- [ ] **步骤 3：Commit**

```bash
git add -A
git commit -m "feat: rewrite globals.css with Lumiracle design tokens"
```

---

## 任务 3：布局基础 — 更新 layout.tsx

**文件：**
- 修改：`src/app/layout.tsx`

- [ ] **步骤 1：更新 layout.tsx**

将 `src/app/layout.tsx` 全部替换为：

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReadingProgress from "@/components/ReadingProgress";
import ScrollToTop from "@/components/ScrollToTop";
import PageTransition from "@/components/PageTransition";
import ThemeProvider from "@/components/ThemeProvider";
import ParticleCanvas from "@/components/ParticleCanvas";
import { getSearchIndex } from "@/lib/posts";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site-config";
import { LazyMotion, domAnimation } from "motion/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
};

const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('theme');
    var dark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const searchIndex = getSearchIndex();

  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <LazyMotion features={domAnimation}>
            <ParticleCanvas />
            <ReadingProgress />
            <Header searchIndex={searchIndex} />
            <main className="flex-1">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
            <Footer />
            <ScrollToTop />
          </LazyMotion>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

注意：此时 ParticleCanvas 组件尚未创建，构建会失败。在任务 5 创建后即可通过。

- [ ] **步骤 2：暂不验证构建（等任务 5 完成后一起验证）**

- [ ] **步骤 3：Commit**

```bash
git add -A
git commit -m "feat: update layout with Cormorant font, LazyMotion, ParticleCanvas"
```

---

## 任务 4：SVG 装饰组件 — MagicCircle + MagicDivider

**文件：**
- 创建：`src/components/MagicCircle.tsx`
- 创建：`src/components/MagicDivider.tsx`

- [ ] **步骤 1：创建 MagicCircle.tsx**

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
      <circle cx="100" cy="100" r="95" stroke="var(--accent)" strokeWidth="1" opacity="0.3"
        style={animate ? { animation: 'spin 20s linear infinite', transformOrigin: '100px 100px' } : undefined} />
      <circle cx="100" cy="100" r="80" stroke="var(--accent-secondary)" strokeWidth="0.5" opacity="0.25"
        style={animate ? { animation: 'spin 15s linear infinite reverse', transformOrigin: '100px 100px' } : undefined} />
      <circle cx="100" cy="100" r="65" stroke="var(--accent-light)" strokeWidth="0.5" strokeDasharray="4 6" opacity="0.2"
        style={animate ? { animation: 'spin 10s linear infinite', transformOrigin: '100px 100px' } : undefined} />
      <circle cx="100" cy="100" r="50" stroke="var(--accent)" strokeWidth="0.5" opacity="0.15"
        style={animate ? { animation: 'spin 8s linear infinite reverse', transformOrigin: '100px 100px' } : undefined} />
      <text x="100" y="108" textAnchor="middle" fill="var(--accent)" fontSize="24" opacity="0.6">✦</text>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
}
```

- [ ] **步骤 2：创建 MagicDivider.tsx**

```tsx
interface MagicDividerProps {
  className?: string;
}

export default function MagicDivider({ className = '' }: MagicDividerProps) {
  return (
    <div className={`relative my-10 ${className}`} aria-hidden="true">
      <svg width="100%" height="20" viewBox="0 0 800 20" preserveAspectRatio="none" className="w-full">
        <defs>
          <linearGradient id="magicLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
            <stop offset="20%" stopColor="var(--accent)" stopOpacity="0.6" />
            <stop offset="50%" stopColor="var(--accent-secondary)" stopOpacity="1" />
            <stop offset="80%" stopColor="var(--accent)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <line x1="0" y1="10" x2="800" y2="10" stroke="url(#magicLine)" strokeWidth="1.5" filter="url(#glow)" />
        <text x="400" y="14" textAnchor="middle" fill="var(--accent)" fontSize="10" opacity="0.5">✦</text>
      </svg>
    </div>
  );
}
```

- [ ] **步骤 3：验证类型检查**

```bash
npx tsc --noEmit
```

预期：无错误

- [ ] **步骤 4：Commit**

```bash
git add -A
git commit -m "feat: add MagicCircle and MagicDivider SVG components"
```

---

## 任务 5：Canvas 粒子组件 — ParticleCanvas

**文件：**
- 创建：`src/components/ParticleCanvas.tsx`

- [ ] **步骤 1：创建 ParticleCanvas.tsx**

```tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useTheme } from './ThemeProvider';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  opacityDir: number;
  color: string;
}

const LIGHT_COLORS = ['#F59E0B', '#FBBF24', '#F97316', '#FDE68A'];
const DARK_COLORS = ['#C4B5FD', '#E0E7FF', '#FBBF24', '#A5B4FC'];
const PARTICLE_COUNT = 50;
const TRAIL_LIFETIME = 800;

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, trails: [] as { x: number; y: number; born: number; color: string }[] });
  const rafRef = useRef<number>(0);
  const { resolvedTheme } = useTheme();

  const createParticle = useCallback((width: number, height: number, colors: string[]): Particle => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 3 + 1.5,
    speedX: (Math.random() - 0.5) * 0.3,
    speedY: (Math.random() - 0.5) * 0.3,
    opacity: Math.random() * 0.6 + 0.2,
    opacityDir: Math.random() > 0.5 ? 1 : -1,
    color: colors[Math.floor(Math.random() * colors.length)],
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = resolvedTheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(canvas.width, canvas.height, colors)
    );

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      const trailColors = resolvedTheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
      mouseRef.current.trails.push({
        x: e.clientX,
        y: e.clientY,
        born: Date.now(),
        color: trailColors[Math.floor(Math.random() * trailColors.length)],
      });
      if (mouseRef.current.trails.length > 30) {
        mouseRef.current.trails.shift();
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = Date.now();
      mouseRef.current.trails = mouseRef.current.trails.filter(
        (t) => now - t.born < TRAIL_LIFETIME
      );

      for (const trail of mouseRef.current.trails) {
        const age = (now - trail.born) / TRAIL_LIFETIME;
        const alpha = 1 - age;
        const size = 3 * (1 - age);
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, size, 0, Math.PI * 2);
        ctx.fillStyle = trail.color;
        ctx.globalAlpha = alpha * 0.6;
        ctx.shadowBlur = 8;
        ctx.shadowColor = trail.color;
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      for (const p of particlesRef.current) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity += p.opacityDir * 0.005;
        if (p.opacity > 0.8 || p.opacity < 0.1) p.opacityDir *= -1;
        p.opacity = Math.max(0.1, Math.min(0.8, p.opacity));

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [resolvedTheme, createParticle]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
```

- [ ] **步骤 2：验证构建**

```bash
npx next build
```

预期：构建成功。此时 layout.tsx 中的 ParticleCanvas 引用已解析。

- [ ] **步骤 3：Commit**

```bash
git add -A
git commit -m "feat: add ParticleCanvas component with star particles and mouse trail"
```

---

## 任务 6：全局组件 — ThemeToggle + ScrollToTop + ReadingProgress

**文件：**
- 修改：`src/components/ThemeToggle.tsx`
- 修改：`src/components/ScrollToTop.tsx`
- 修改：`src/components/ReadingProgress.tsx`

- [ ] **步骤 1：重写 ThemeToggle.tsx**

```tsx
'use client';

import { useTheme } from './ThemeProvider';
import { m } from 'motion/react';

export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={resolvedTheme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
      className="relative p-2 rounded-lg text-accent hover:bg-muted transition-colors overflow-hidden"
    >
      <m.span
        className="block text-lg leading-none"
        animate={{ rotate: resolvedTheme === 'dark' ? 0 : 180, scale: 1 }}
        initial={false}
        transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
      >
        {resolvedTheme === 'dark' ? '☾' : '✦'}
      </m.span>
    </button>
  );
}
```

- [ ] **步骤 2：重写 ScrollToTop.tsx**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'motion/react';
import MagicCircle from './MagicCircle';

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
          className="fixed bottom-8 right-8 z-50 w-11 h-11 rounded-full bg-gradient-to-br from-accent to-accent-secondary text-white shadow-lg flex items-center justify-center hover:shadow-[0_0_20px_var(--glow)] transition-shadow"
        >
          <MagicCircle size={20} animate={false} className="opacity-80" />
        </m.button>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **步骤 3：重写 ReadingProgress.tsx**

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function ReadingProgress() {
  const pathname = usePathname();
  const isPostPage = pathname.startsWith('/posts/');
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isPostPage) return;

    const updateProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        setProgress(Math.min((window.scrollY / scrollHeight) * 100, 100));
      }
    };

    updateProgress();

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateProgress);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isPostPage]);

  if (!isPostPage) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[3px]">
      <div
        className="h-full gradient-light-bar transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
```

- [ ] **步骤 4：验证类型检查**

```bash
npx tsc --noEmit
```

预期：无错误

- [ ] **步骤 5：Commit**

```bash
git add -A
git commit -m "feat: update ThemeToggle, ScrollToTop, ReadingProgress with magic theme"
```

---

## 任务 7：全局组件 — Header

**文件：**
- 修改：`src/components/Header.tsx`

- [ ] **步骤 1：重写 Header.tsx**

```tsx
'use client';

import Link from 'next/link';
import { Menu, X, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'motion/react';
import SearchDialog from './SearchDialog';
import ThemeToggle from './ThemeToggle';
import { NAV_LINKS } from '@/lib/site-config';
import { usePathname } from 'next/navigation';
import type { SearchIndexItem } from '@/lib/posts';

interface HeaderProps {
  searchIndex: SearchIndexItem[];
}

export default function Header({ searchIndex }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="bg-background/80 backdrop-blur-md border-b border-border transition-colors relative z-10">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground hover:text-accent transition-colors font-[family-name:var(--font-cormorant)]">
              <span className="text-accent text-2xl">✦</span>
              <span>Lumiracle</span>
            </Link>

            <div className="hidden md:flex items-center gap-4">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link key={link.href} href={link.href}
                    className={`transition-colors font-medium ${
                      isActive
                        ? 'text-accent'
                        : 'text-muted-foreground hover:text-accent'
                    }`}>
                    {isActive && <span className="mr-1">✦</span>}
                    {link.label}
                  </Link>
                );
              })}
              <button type="button" onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted border border-border rounded-lg hover:border-accent hover:text-accent transition-colors">
                <Search className="w-4 h-4" />
                <span>魔法探知</span>
                <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-background rounded border border-border">
                  ⌘K
                </kbd>
              </button>
              <ThemeToggle />
            </div>

            <div className="flex md:hidden items-center gap-1">
              <ThemeToggle />
              <button type="button" onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                <Search className="w-5 h-5" />
              </button>
              <button type="button"
                className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isOpen && (
              <m.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden overflow-hidden border-t border-border"
              >
                <div className="flex flex-col gap-4 py-4">
                  {NAV_LINKS.map((link) => {
                    const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                    return (
                      <Link key={link.href} href={link.href}
                        className={`transition-colors font-medium py-2 ${
                          isActive ? 'text-accent' : 'text-muted-foreground hover:text-accent'
                        }`}
                        onClick={() => setIsOpen(false)}>
                        {isActive && <span className="mr-1">✦</span>}
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </nav>
        <div className="gradient-header-bar" />
      </header>

      <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} searchIndex={searchIndex} />
    </>
  );
}
```

- [ ] **步骤 2：验证类型检查**

```bash
npx tsc --noEmit
```

- [ ] **步骤 3：Commit**

```bash
git add -A
git commit -m "feat: update Header with Lumiracle branding, star prefix nav, gradient bar"
```

---

## 任务 8：全局组件 — Footer + SearchDialog + PostCard + PageTransition

**文件：**
- 修改：`src/components/Footer.tsx`
- 修改：`src/components/SearchDialog.tsx`
- 修改：`src/components/PostCard.tsx`
- 修改：`src/components/PageTransition.tsx`

- [ ] **步骤 1：重写 Footer.tsx**

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { SITE_BIRTH_DATE, VISITOR_PAGE_ID, FOOTER_LABELS } from '@/lib/site-config';
import MagicDivider from './MagicDivider';

function calcRunningDays(): number {
  return Math.floor((Date.now() - SITE_BIRTH_DATE.getTime()) / 86400000);
}

export default function Footer() {
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [visitorCount, setVisitorCount] = useState<string | null>(null);
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

  useEffect(() => {
    fetch(`https://visitor-badge.laobi.icu/total?page_id=${VISITOR_PAGE_ID}`)
      .then((res) => res.text())
      .then((text) => {
        const count = text.trim();
        if (count && /^\d+$/.test(count)) {
          setVisitorCount(count);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-muted/50 border-t border-border mt-auto transition-colors relative z-10">
      <MagicDivider className="my-0" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-center text-sm text-muted-foreground leading-relaxed">
          <span>{FOOTER_LABELS.loadTime}：<span className="text-foreground font-medium">{loadTime ?? '--'}</span> ms</span>
          <span className="mx-2 text-border">·</span>
          <span>{FOOTER_LABELS.visitors}：<span className="text-foreground font-medium">{visitorCount ?? '--'}</span></span>
          <span className="mx-2 text-border">·</span>
          <span>{FOOTER_LABELS.runningDays} <span className="text-foreground font-medium">{runningDays}</span> 天</span>
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **步骤 2：重写 SearchDialog.tsx**

将 SearchDialog.tsx 中所有 `indigo` 相关的 class 替换为魔法主题色：
- `bg-indigo-50 dark:bg-indigo-500/10` → `bg-accent/10`
- `hover:bg-gray-50 dark:hover:bg-slate-700/50` → `hover:bg-muted`
- `text-indigo-600 dark:text-indigo-400` → `text-accent`
- `bg-white dark:bg-slate-800` → `bg-card`
- `border-gray-200 dark:border-slate-700` → `border-border`
- `text-gray-900 dark:text-slate-100` → `text-foreground`
- `text-gray-500 dark:text-slate-400` → `text-muted-foreground`
- `bg-gray-50/50 dark:bg-slate-800/50` → `bg-muted/50`
- `bg-white dark:bg-slate-700` → `bg-card`
- `border-gray-200 dark:border-slate-600` → `border-border`
- `text-gray-400 dark:text-slate-500` → `text-muted-foreground`
- `placeholder-gray-400 dark:placeholder-slate-500` → `placeholder-muted-foreground`
- `hover:text-gray-600 dark:hover:text-slate-300` → `hover:text-foreground`
- `hover:bg-gray-100 dark:hover:bg-slate-700` → `hover:bg-muted`
- `bg-black/40 dark:bg-black/60` → `bg-black/40`
- 搜索框外层 div 加 `border-accent/30` 和 `shadow-[0_0_16px_var(--glow)]`
- 搜索 placeholder 改为 "搜索魔法书卷..."
- 底部提示区文字改为魔法主题

完整文件：

```tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, FileText, Tag } from 'lucide-react';
import type { SearchIndexItem } from '@/lib/posts';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  searchIndex: SearchIndexItem[];
}

export default function SearchDialog({ isOpen, onClose, searchIndex }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchIndexItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const search = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = searchIndex.filter((post) => {
      return (
        post.title.toLowerCase().includes(lowerQuery) ||
        post.description.toLowerCase().includes(lowerQuery) ||
        post.category.toLowerCase().includes(lowerQuery) ||
        post.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
    });
    setResults(filtered);
    setSelectedIndex(0);
  }, [searchIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        router.push(`/posts/${results[selectedIndex].slug}/`);
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, results, selectedIndex, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-w-xl mx-auto mt-[15vh] px-4">
        <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden shadow-[0_0_16px_var(--glow)]">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <input ref={inputRef} type="text" value={query}
              onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
              placeholder="搜索魔法书卷..."
              className="flex-1 text-foreground placeholder-muted-foreground outline-none text-lg bg-transparent" />
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {query.trim() && (
            <div className="max-h-80 overflow-y-auto">
              {results.length > 0 ? (
                <ul>
                  {results.map((post, index) => (
                    <li key={post.slug}>
                      <Link href={`/posts/${post.slug}/`} onClick={onClose}
                        className={`flex items-start gap-3 px-5 py-3.5 transition-colors ${
                          index === selectedIndex
                            ? 'bg-accent/10'
                            : 'hover:bg-muted'
                        }`}>
                        <FileText className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{post.description}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="inline-flex items-center gap-1 text-xs text-accent">
                              <Tag className="w-3 h-3" />{post.category}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-10 text-center">
                  <p className="text-muted-foreground text-sm">
                    未找到与 &ldquo;{query}&rdquo; 相关的结果
                  </p>
                </div>
              )}
            </div>
          )}

          {!query.trim() && (
            <div className="px-5 py-6 text-center">
              <p className="text-muted-foreground text-sm">
                输入关键词搜索文章标题、描述、分类或标签
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 px-5 py-3 border-t border-border bg-muted/50 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-card rounded border border-border text-[10px] font-mono">↑↓</kbd>
              导航
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-card rounded border border-border text-[10px] font-mono">↵</kbd>
              打开
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-card rounded border border-border text-[10px] font-mono">esc</kbd>
              关闭
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **步骤 3：重写 PostCard.tsx**

```tsx
import Link from 'next/link';
import { Calendar, ArrowRight, Tag, Pin, Clock } from 'lucide-react';
import { PostMetadata } from '@/lib/posts';

interface PostCardProps {
  post: PostMetadata;
  featured?: boolean;
  index?: number;
}

export default function PostCard({ post, featured = false, index = 0 }: PostCardProps) {
  return (
    <article
      className={`glow-card bg-card rounded-xl overflow-hidden transition-all duration-300 ${
        featured
          ? 'border-accent/50'
          : ''
      }`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <Link href={`/categories/${post.category.toLowerCase().replace(/\s+/g, '-')}/`}
            className="inline-flex items-center gap-1.5 text-sm text-accent font-medium hover:text-accent-secondary transition-colors">
            <Tag className="w-3.5 h-3.5" />
            <span>{post.category}</span>
          </Link>
          {featured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium magic-badge rounded-full">
              <Pin className="w-3 h-3" />置顶
            </span>
          )}
        </div>

        <Link href={`/posts/${post.slug}/`} className="block">
          <h2 className="text-xl font-bold text-foreground mb-2 hover:text-accent transition-colors">
            {post.title}
          </h2>
        </Link>

        <p className="text-muted-foreground mb-4 line-clamp-2">{post.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <time dateTime={post.date}>{post.date}</time>
            </div>
            {post.readingTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{post.readingTime} 分钟</span>
              </div>
            )}
          </div>
          <Link href={`/posts/${post.slug}/`}
            className="flex items-center gap-1 text-sm font-medium text-accent group">
            阅读更多
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag) => (
              <span key={tag}
                className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="gradient-light-bar" />
    </article>
  );
}
```

- [ ] **步骤 4：重写 PageTransition.tsx**

```tsx
'use client';

import { usePathname } from 'next/navigation';
import { m, AnimatePresence } from 'motion/react';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
```

- [ ] **步骤 5：验证类型检查**

```bash
npx tsc --noEmit
```

- [ ] **步骤 6：Commit**

```bash
git add -A
git commit -m "feat: update Footer, SearchDialog, PostCard, PageTransition with magic theme"
```

---

## 任务 9：首页 — 星穹殿堂布局

**文件：**
- 修改：`src/app/page.tsx`

- [ ] **步骤 1：重写首页**

```tsx
import { getSortedPostsData, getCategories } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import MagicCircle from '@/components/MagicCircle';
import Link from 'next/link';
import { Sparkles, BookOpen } from 'lucide-react';
import { SITE_NAME, SITE_SUBTITLE } from '@/lib/site-config';

export default function Home() {
  const allPostsData = getSortedPostsData();
  const categories = getCategories();

  return (
    <div className="relative z-10">
      <section className="bg-gradient-to-br from-amber-50/80 via-background to-orange-50/50 dark:from-indigo-950/50 dark:via-background dark:to-purple-950/30 py-20 px-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
          <MagicCircle size={400} />
        </div>
        <div className="max-w-6xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />欢迎来到星穹殿堂
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 font-[family-name:var(--font-cormorant)]">
            {SITE_NAME}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {SITE_SUBTITLE} · 记录与存档
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-2xl font-bold text-foreground">最近更新</h2>
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-accent text-sm">✦</span>
        </div>
        {allPostsData.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {allPostsData.map((post, index) => (
              <PostCard key={post.slug} post={post} featured={post.featured} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/50 rounded-xl border border-border">
            <p className="text-muted-foreground">暂无内容，敬请期待！</p>
          </div>
        )}
      </section>

      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl font-bold text-foreground">魔法书库</h2>
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-accent text-sm">✦</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link key={category.name} href={`/categories/${category.name.toLowerCase().replace(/\s+/g, '-')}/`}
                className="group block p-6 bg-card rounded-xl border border-border shadow-sm hover:shadow-[0_0_16px_var(--glow)] hover:border-accent/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <BookOpen className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                      {category.name}
                    </h3>
                  </div>
                  <span className="text-sm text-muted-foreground">{category.count} 篇</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **步骤 2：验证类型检查**

```bash
npx tsc --noEmit
```

- [ ] **步骤 3：Commit**

```bash
git add -A
git commit -m "feat: rewrite home page with star palace layout"
```

---

## 任务 10：分类页 — 魔法书库

**文件：**
- 修改：`src/app/categories/page.tsx`
- 修改：`src/app/categories/[category]/page.tsx`

- [ ] **步骤 1：重写 categories/page.tsx**

```tsx
import { getCategories } from '@/lib/posts';
import Link from 'next/link';
import { BookOpen, FileText } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '魔法书库 - Lumiracle',
  description: '浏览所有分类',
};

export default function CategoriesPage() {
  const categories = getCategories();

  return (
    <div className="relative z-10">
      <div className="bg-gradient-to-br from-amber-50/80 via-background to-orange-50/50 dark:from-indigo-950/50 dark:via-background dark:to-purple-950/30 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium mb-6">
            <BookOpen className="w-4 h-4" />魔法书库
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            按分类<span className="text-accent">浏览</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            按主题分类浏览文章，找到你感兴趣的内容。
          </p>
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {categories.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link key={category.name} href={`/categories/${category.name.toLowerCase().replace(/\s+/g, '-')}/`}
                className="group block p-6 bg-card rounded-xl border border-border shadow-sm hover:shadow-[0_0_16px_var(--glow)] hover:border-accent/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <BookOpen className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                        {category.name}
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" /><span>{category.count}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/50 rounded-xl border border-border">
            <p className="text-muted-foreground">暂无分类。</p>
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **步骤 2：重写 categories/[category]/page.tsx**

```tsx
import { getCategories, getPostsByCategory } from '@/lib/posts';
import PostCard from '@/components/PostCard';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  const categories = getCategories();
  return categories.map((cat) => ({
    category: cat.name.toLowerCase().replace(/\s+/g, '-'),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const categoryName = category.replace(/-/g, ' ');
  return {
    title: `${categoryName} - Lumiracle`,
    description: `${categoryName} 分类下的文章`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const categoryName = category.replace(/-/g, ' ');
  const posts = getPostsByCategory(categoryName);

  return (
    <div className="relative z-10">
      <div className="bg-gradient-to-br from-amber-50/80 via-background to-orange-50/50 dark:from-indigo-950/50 dark:via-background dark:to-purple-950/30 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/categories/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />返回魔法书库
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-accent" />
            </div>
            <h1 className="text-4xl font-bold text-foreground capitalize">{categoryName}</h1>
          </div>
          <p className="text-lg text-muted-foreground">{posts.length} 篇文章</p>
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post, index) => (
              <PostCard key={post.slug} post={post} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/50 rounded-xl border border-border">
            <p className="text-muted-foreground">该分类下暂无文章。</p>
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **步骤 3：验证类型检查**

```bash
npx tsc --noEmit
```

- [ ] **步骤 4：Commit**

```bash
git add -A
git commit -m "feat: update category pages with magic theme"
```

---

## 任务 11：归档页 + 更新日志页

**文件：**
- 修改：`src/app/archive/page.tsx`
- 修改：`src/app/changelog/page.tsx`

- [ ] **步骤 1：重写 archive/page.tsx**

```tsx
import { getPostsGroupedByYear } from '@/lib/posts';
import Link from 'next/link';
import { Calendar, Archive, Tag } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '时光回廊 - Lumiracle',
  description: '按日期浏览所有文章',
};

export default function ArchivePage() {
  const postsByYear = getPostsGroupedByYear();
  const years = Object.keys(postsByYear).sort((a, b) => Number(b) - Number(a));
  const totalPosts = Object.values(postsByYear).reduce((sum, posts) => sum + posts.length, 0);

  return (
    <div className="relative z-10">
      <div className="bg-gradient-to-br from-amber-50/80 via-background to-orange-50/50 dark:from-indigo-950/50 dark:via-background dark:to-purple-950/30 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium mb-6">
            <Archive className="w-4 h-4" />时光回廊
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            文章<span className="text-accent">归档</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            共 {totalPosts} 篇文章，跨越 {years.length} 年
          </p>
        </div>
      </div>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {years.map((year) => (
          <div key={year} className="mb-12 last:mb-0">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-accent-secondary text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-[0_0_12px_var(--glow)]">
                {year}
              </div>
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-sm text-muted-foreground">{postsByYear[year].length} 篇</span>
            </div>
            <div className="ml-7 border-l-2 border-accent/20 pl-8 space-y-4">
              {postsByYear[year].map((post) => (
                <Link key={post.slug} href={`/posts/${post.slug}/`}
                  className="group block py-4 px-5 -ml-5 rounded-lg hover:bg-accent/5 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                      <Calendar className="w-3.5 h-3.5" /><time dateTime={post.date}>{post.date}</time>
                    </div>
                    <h2 className="text-lg font-medium text-foreground group-hover:text-accent transition-colors">
                      {post.title}
                    </h2>
                    <div className="flex items-center gap-1.5 text-sm text-accent shrink-0">
                      <Tag className="w-3.5 h-3.5" /><span>{post.category}</span>
                    </div>
                  </div>
                  {post.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{post.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
```

- [ ] **步骤 2：重写 changelog/page.tsx**

将 changelog/page.tsx 中的颜色替换为魔法主题：
- `bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300` → `bg-accent/10 text-accent`
- `bg-indigo-600 dark:bg-indigo-500` → `bg-gradient-to-br from-accent to-accent-secondary` + `shadow-[0_0_12px_var(--glow)]`
- `text-indigo-600 dark:text-indigo-400` → `text-accent`
- `hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5` → `hover:bg-accent/5`
- `bg-gray-50 dark:hover:bg-slate-800/50` → `hover:bg-muted/50`
- `border-l-2 border-gray-100 dark:border-slate-700` → `border-l-2 border-accent/20`
- 类型标签颜色：新增→`bg-accent/10 text-accent`，优化→`bg-accent-secondary/10 text-accent-secondary`，修复→`bg-accent-rose/10 text-accent-rose`
- `bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300` → `bg-accent/10 text-accent`
- `bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300` → `bg-accent-secondary/10 text-accent-secondary`
- `bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300` → `bg-accent-rose/10 text-accent-rose`
- metadata title 改为 `'魔法记录 - Lumiracle'`
- Hero badge 文字改为 `魔法记录`
- Hero 标题改为 `网站更新记录`

- [ ] **步骤 3：验证类型检查**

```bash
npx tsc --noEmit
```

- [ ] **步骤 4：Commit**

```bash
git add -A
git commit -m "feat: update archive and changelog pages with magic theme"
```

---

## 任务 12：文章页 + 关于页

**文件：**
- 修改：`src/app/posts/[slug]/page.tsx`
- 修改：`src/app/about/page.tsx`
- 修改：`src/components/MarkdownRenderer.tsx`

- [ ] **步骤 1：重写 posts/[slug]/page.tsx**

```tsx
import { getAllPostSlugs, getPostData } from '@/lib/posts';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { highlightMarkdown } from '@/lib/shiki-highlight';
import MagicDivider from '@/components/MagicDivider';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag, Clock } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostData(slug);
  return {
    title: `${post.title} - Lumiracle`,
    description: post.description,
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostData(slug);
  const highlightedContent = await highlightMarkdown(post.content);

  return (
    <div className="relative z-10">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />返回书卷列表
        </Link>

        <header className="mb-10">
          <div className="flex items-center gap-2 text-sm text-accent font-medium mb-3">
            <Tag className="w-4 h-4" /><span>{post.category}</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /><time dateTime={post.date}>{post.date}</time>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" /><span>{post.readingTime} 分钟阅读</span>
            </div>
          </div>
          <p className="text-lg text-muted-foreground border-l-4 border-accent pl-4">
            {post.description}
          </p>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {post.tags.map((tag) => (
                <span key={tag}
                  className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <MagicDivider />

        <MarkdownRenderer content={highlightedContent} />
      </article>
    </div>
  );
}
```

- [ ] **步骤 2：重写 about/page.tsx**

```tsx
import { Mail, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="relative z-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium mb-6">
            ✦ 守护者之室
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-6 font-[family-name:var(--font-cormorant)]">关于本站</h1>
          <p className="text-lg text-muted-foreground mb-6">这里是我记录生活、存档资源的地方。</p>
          <p className="text-muted-foreground mb-8">没什么特别的，就是随手写写、随手存存。</p>
        </div>
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
  );
}
```

- [ ] **步骤 3：更新 MarkdownRenderer.tsx 的 prose 主题**

将 MarkdownRenderer.tsx 中的 `prose prose-gray dark:prose-invert` 替换为 `prose prose-amber dark:prose-invert`，使 typography 插件适配琥珀晨曦配色。

- [ ] **步骤 4：验证构建**

```bash
npx next build
```

预期：构建成功

- [ ] **步骤 5：Commit**

```bash
git add -A
git commit -m "feat: update post page, about page, and MarkdownRenderer with magic theme"
```

---

## 任务 13：最终验证 — 构建检查 + 视觉验证

**文件：**
- 无新文件

- [ ] **步骤 1：运行完整构建**

```bash
npx next build
```

预期：构建成功，无错误

- [ ] **步骤 2：启动开发服务器**

```bash
npm run dev
```

- [ ] **步骤 3：视觉验证清单**

在浏览器中逐一检查：
- [ ] 首页：Hero 区魔法阵 + Lumiracle 标题 + 星光粒子背景
- [ ] 首页：文章卡片光晕边框 + 底部光带 + 悬浮发光
- [ ] 首页：魔法书库分类入口
- [ ] 导航栏：✦ Lumiracle logo + 星标前缀当前页 + 渐变光带
- [ ] 主题切换：✦/☾ 图标 + 旋转动画
- [ ] 暗色模式：月夜魔法配色 + 萤火金粒子
- [ ] 分类页：魔法书库主题
- [ ] 归档页：渐变年份徽章 + 魔法光束时间线
- [ ] 更新日志：魔法色彩标签
- [ ] 文章页：魔法分隔线 + 渐变进度条
- [ ] 关于页：光晕边框联系卡片
- [ ] 搜索弹窗：光晕边框 + 柔光高亮
- [ ] 返回顶部：魔法阵图标
- [ ] 鼠标光尾效果
- [ ] 页面过渡动画

- [ ] **步骤 4：运行 lint**

```bash
npm run lint
```

预期：无错误

- [ ] **步骤 5：最终 Commit**

```bash
git add -A
git commit -m "feat: complete Lumiracle magical girl theme transformation"
```
