import Link from 'next/link';
import { Calendar, ArrowRight, Tag, Pin, Clock } from 'lucide-react';
import { PostMetadata } from '@/lib/posts';

interface PostCardProps {
  post: PostMetadata;
  featured?: boolean;
  index?: number;
}

export default function PostCard({ post, featured = false }: PostCardProps) {
  return (
    <article
      className={`bg-card border-l-[3px] border-l-accent rounded-r-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_12px_var(--glow)] ${
        featured
          ? 'border-l-accent-secondary'
          : ''
      }`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <Link href={`/categories/${post.category.toLowerCase().replace(/\s+/g, '-')}/`}
            className="inline-flex items-center gap-1.5 text-sm text-accent font-medium hover:text-accent-secondary transition-colors">
            <Tag className="w-3.5 h-3.5" />
            <span>{post.category}</span>
          </Link>
          {featured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium magic-badge rounded-full">
              <Pin className="w-3 h-3" />置顶
            </span>
          )}
        </div>

        <Link href={`/posts/${post.slug}/`} className="block">
          <h2 className="text-xl font-bold text-foreground mb-2 hover:text-accent transition-colors">
            {post.title}
          </h2>
        </Link>

        <p className="text-muted-foreground mb-4 line-clamp-2">{post.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <time dateTime={post.date}>{post.date}</time>
            </div>
            {post.readingTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{post.readingTime} 分钟</span>
              </div>
            )}
          </div>
          <Link href={`/posts/${post.slug}/`}
            className="flex items-center gap-1 text-sm font-medium text-accent group">
            阅读更多
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag) => (
              <span key={tag}
                className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
