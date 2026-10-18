'use client';

import { useTheme } from './ThemeProvider';
import { m } from 'motion/react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={mounted ? (resolvedTheme === 'dark' ? '切换到浅色模式' : '切换到深色模式') : '切换主题'}
      className="relative p-2 rounded-lg text-accent hover:bg-muted transition-colors overflow-hidden"
    >
      <m.span
        className="block text-lg leading-none"
        animate={mounted ? { rotate: resolvedTheme === 'dark' ? 0 : 180, scale: 1 } : {}}
        initial={false}
        transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
      >
        {mounted ? (resolvedTheme === 'dark' ? '☾' : '✦') : '✦'}
      </m.span>
    </button>
  );
}
