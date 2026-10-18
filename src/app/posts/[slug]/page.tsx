import { getAllPostSlugs, getPostData } from '@/lib/posts';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { highlightMarkdown } from '@/lib/shiki-highlight';
import MagicDivider from '@/components/MagicDivider';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag, Clock } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostData(slug);
  return {
    title: `${post.title} - Lumiracle`,
    description: post.description,
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostData(slug);
  const highlightedContent = await highlightMarkdown(post.content);

  return (
    <div className="relative z-10">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />返回书卷列表
        </Link>

        <header className="mb-10">
          <div className="flex items-center gap-2 text-sm text-accent font-medium mb-3">
            <Tag className="w-4 h-4" /><span>{post.category}</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /><time dateTime={post.date}>{post.date}</time>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" /><span>{post.readingTime} 分钟阅读</span>
            </div>
          </div>
          <p className="text-lg text-muted-foreground border-l-4 border-accent pl-4">
            {post.description}
          </p>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {post.tags.map((tag) => (
                <span key={tag}
                  className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <MagicDivider />

        <MarkdownRenderer content={highlightedContent} />
      </article>
    </div>
  );
}
