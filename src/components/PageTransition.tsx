'use client';

import { useRef } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, m } from 'motion/react';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useRef(false);

  if (typeof window !== 'undefined') {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.current = mq.matches;
  }

  const exitVariants = prefersReducedMotion.current 
    ? { opacity: 0 } 
    : { opacity: 0, scale: 0.98 };

  const enterVariants = prefersReducedMotion.current
    ? { opacity: 1 }
    : { opacity: 1, scale: 1 };

  const initialVariants = prefersReducedMotion.current
    ? { opacity: 1 }
    : { opacity: 0, scale: 0.98 };

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={pathname}
        initial={initialVariants}
        animate={enterVariants}
        exit={exitVariants}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}