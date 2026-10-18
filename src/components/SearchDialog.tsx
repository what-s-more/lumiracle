'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, FileText, Tag } from 'lucide-react';
import type { SearchIndexItem } from '@/lib/posts';
import { searchPosts, type SearchHit } from '@/lib/search';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  searchIndex: SearchIndexItem[];
}

export default function SearchDialog({ isOpen, onClose, searchIndex }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchSeq = useRef(0);
  const router = useRouter();

  // 分类信息仍取自文章元数据（Pagefind 只负责检索本身）
  const categoryBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const post of searchIndex) map.set(post.slug, post.category);
    return map;
  }, [searchIndex]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setIsSearching(false);
      setSelectedIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // 检索交由 Pagefind 静态索引完成（防抖 + 丢弃过期结果）
  useEffect(() => {
    if (!isOpen) return;
    const keyword = query.trim();
    if (!keyword) {
      setResults([]);
      setIsSearching(false);
      setSelectedIndex(0);
      return;
    }
    const seq = ++searchSeq.current;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      const hits = await searchPosts(keyword);
      if (seq !== searchSeq.current) return;
      setResults(hits);
      setSelectedIndex(0);
      setIsSearching(false);
    }, 120);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

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
        router.push(results[selectedIndex].url);
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, results, selectedIndex, router]);

  const handleChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-w-xl mx-auto mt-[15vh] px-4">
        <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden shadow-[0_0_16px_var(--glow)]">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <input ref={inputRef} type="text" value={query}
              onChange={(e) => handleChange(e.target.value)}
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
                    <li key={post.url}>
                      <Link href={post.url} onClick={onClose}
                        className={`flex items-start gap-3 px-5 py-3.5 transition-colors ${
                          index === selectedIndex
                            ? 'bg-accent/10'
                            : 'hover:bg-muted'
                        }`}>
                        <FileText className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 [&_mark]:text-accent [&_mark]:bg-transparent [&_mark]:font-semibold"
                            dangerouslySetInnerHTML={{ __html: post.excerpt }} />
                          {categoryBySlug.has(post.slug) && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="inline-flex items-center gap-1 text-xs text-accent">
                                <Tag className="w-3 h-3" />{categoryBySlug.get(post.slug)}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-10 text-center">
                  <p className="text-muted-foreground text-sm">
                    {isSearching ? '检索中…' : <>未找到与 &ldquo;{query}&rdquo; 相关的结果</>}
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
