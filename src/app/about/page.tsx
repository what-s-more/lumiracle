import { getPostsGroupedByYear } from '@/lib/posts';
import { Mail, Globe, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import MagicDivider from '@/components/MagicDivider';
import { DASHBOARD_LABELS } from '@/lib/site-config';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '守护者之室 - Lumiracle',
  description: '关于本站与守护者',
};

export default function AboutPage() {
  const postsByYear = getPostsGroupedByYear();
  const years = Object.keys(postsByYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="relative z-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 头像区 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent-secondary mx-auto mb-4 flex items-center justify-center text-2xl shadow-[0_0_16px_var(--glow)]">
            ✦
          </div>
          <h1 className="text-xl font-bold text-foreground font-[family-name:var(--font-cormorant)]">Lumiracle</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            收集灵光与碎片<br />编织成记忆的星河
          </p>
        </div>

        {/* 联系方式 */}
        <div className="flex justify-center gap-3 mb-8">
          <a href="mailto:oo4272601@gmail.com"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground border border-border rounded-full hover:border-accent hover:text-accent transition-colors">
            <Mail className="w-4 h-4" /><span>Email</span>
          </a>
          <a href="https://github.com/what-s-more" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground border border-border rounded-full hover:border-accent hover:text-accent transition-colors">
            <Globe className="w-4 h-4" /><span>GitHub</span>
          </a>
          <Link href="/dashboard/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground border border-border rounded-full hover:border-accent hover:text-accent transition-colors">
            <BarChart3 className="w-4 h-4" /><span>{DASHBOARD_LABELS.entry}</span>
          </Link>
        </div>

        {/* 魔法分隔线 */}
        <MagicDivider />

        {/* 文章归档 */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-accent text-xs">✦</span>
            <h2 className="text-sm font-bold text-accent">文章归档</h2>
          </div>
          {years.map((year) => (
            <div key={year} className="mb-4">
              <h3 className="text-sm font-bold text-foreground mb-2">{year}</h3>
              <div className="space-y-1">
                {postsByYear[year].map((post) => (
                  <Link key={post.slug} href={`/posts/${post.slug}/`}
                    className="flex justify-between items-center py-1.5 px-2 -mx-2 rounded hover:bg-accent/5 transition-colors group">
                    <span className="text-sm text-foreground group-hover:text-accent transition-colors truncate mr-4">{post.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{post.date.slice(5)}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
