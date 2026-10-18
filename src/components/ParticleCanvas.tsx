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
  trail: { x: number; y: number }[];
}

interface SparkleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  color: string;
  lifetime: number;
}

const LIGHT_COLORS = ['#F59E0B', '#FBBF24', '#F97316', '#FDE68A'];
const DARK_COLORS = ['#C4B5FD', '#E0E7FF', '#FBBF24', '#A5B4FC'];
const PARTICLE_COUNT = 50;
const TRAIL_LIFETIME = 1000;

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

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({
    x: -1000,
    y: -1000,
    trails: [] as { x: number; y: number; born: number; color: string }[],
    sparkles: [] as SparkleParticle[],
  });
  const rafRef = useRef<number>(0);
  const { resolvedTheme } = useTheme();

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
      if (mouseRef.current.trails.length > 40) {
        mouseRef.current.trails.shift();
      }

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

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

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
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden="true"
    />
  );
}
