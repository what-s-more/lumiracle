'use client';

/**
 * 文章页内问答入口（T3 / M1-C）
 *
 * 带上当前文章 slug 触发全局 AskDialog，使检索偏向本文内容。
 * 仅新增入口，不改动文章页既有内容与排版。
 */

import { openAskDialog } from './AskDialog';
import { ASK_LABELS } from '@/lib/site-config';

interface PostAskProps {
  slug: string;
  title: string;
}

export default function PostAsk({ slug, title }: PostAskProps) {
  return (
    <div className="mt-12 pt-8 border-t border-border" data-pagefind-ignore>
      <button
        type="button"
        onClick={() => openAskDialog({ slug, title })}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-border bg-muted text-muted-foreground hover:border-accent hover:text-accent transition-colors">
        <span className="text-accent">✦</span>
        <span>就本文提问</span>
      </button>
      <p className="mt-3 text-xs text-muted-foreground">{ASK_LABELS.idleHint}</p>
    </div>
  );
}
