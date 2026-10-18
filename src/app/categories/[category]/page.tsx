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
