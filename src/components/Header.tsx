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
