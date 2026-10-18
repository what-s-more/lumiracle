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
