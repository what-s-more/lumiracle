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
      <section className="bg-transparent py-16 px-4 relative overflow-hidden">
  <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12 relative">
    {/* 左侧文字区 */}
    <div className="flex-1 text-center">
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
                className="group block p-6 bg-card border-l-[3px] border-l-accent rounded-r-xl shadow-sm hover:shadow-[0_0_12px_var(--glow)] transition-all duration-300">
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
