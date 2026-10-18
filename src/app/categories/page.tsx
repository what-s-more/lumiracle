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
                className="group block p-6 bg-card border-l-[3px] border-l-accent rounded-r-xl shadow-sm hover:shadow-[0_0_12px_var(--glow)] transition-all duration-300">
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
