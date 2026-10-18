'use client';

/**
 * 文章评论（T6 / M4）
 *
 * 读取 /api/comment?slug= 展示已发布评论，提交 POST 到同一接口。
 * 管理端入口默认隐藏：点击「管理」输入令牌（存 localStorage），
 * 之后每条评论出现删除按钮，删除请求带 x-admin-token 头。
 *
 * 纯新增组件，挂在文章页末尾；容器标 data-pagefind-ignore，避免评论进入全文索引。
 */

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Send, Trash2, MessageCircle } from 'lucide-react';
import { COMMENT_LABELS } from '@/lib/site-config';

interface CommentItem {
  id: number;
  author: string;
  content: string;
  created_at: number;
}

const ADMIN_TOKEN_KEY = 'lumiracle:admin-token';

function formatTime(seconds: number): string {
  return new Date(seconds * 1000).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PostComments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [adminToken, setAdminToken] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/comment?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' });
      if (!res.ok) {
        setError('评论服务暂时不可用，请稍后重试。');
        setComments([]);
        return;
      }
      const data = (await res.json()) as { comments?: CommentItem[] };
      setComments(data.comments ?? []);
    } catch {
      setError('网络异常，未能加载评论。');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  // 令牌来自 localStorage，放在 effect 中读取，避免服务端/客户端首帧不一致
  useEffect(() => {
    try {
      setAdminToken(window.localStorage.getItem(ADMIN_TOKEN_KEY) || '');
    } catch {
      /* 忽略隐私模式下的存储异常 */
    }
  }, []);

  const saveAdminToken = useCallback((value: string) => {
    setAdminToken(value);
    try {
      if (value) window.localStorage.setItem(ADMIN_TOKEN_KEY, value);
      else window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch {
      /* 忽略 */
    }
  }, []);

  const submit = useCallback(async () => {
    const a = author.trim();
    const c = content.trim();
    if (!a || !c || submitting) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, author: a, content: c }),
      });
      const data = (await res.json()) as { comment?: CommentItem; error?: string };
      if (!res.ok || !data.comment) {
        setSubmitError(data.error || '提交失败，请稍后重试。');
        return;
      }
      setComments((prev) => [data.comment as CommentItem, ...prev]);
      setContent('');
    } catch {
      setSubmitError('网络异常，提交失败。');
    } finally {
      setSubmitting(false);
    }
  }, [author, content, slug, submitting]);

  const remove = useCallback(
    async (id: number) => {
      if (!window.confirm(COMMENT_LABELS.deleteConfirm)) return;
      try {
        const res = await fetch(`/api/comment?id=${id}`, {
          method: 'DELETE',
          headers: { 'x-admin-token': adminToken },
        });
        if (!res.ok) {
          setError('删除失败，请检查管理令牌。');
          return;
        }
        setComments((prev) => prev.filter((item) => item.id !== id));
      } catch {
        setError('网络异常，删除失败。');
      }
    },
    [adminToken],
  );

  return (
    <section className="mt-12" data-pagefind-ignore>
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-4 h-4 text-accent" />
        <h2 className="text-sm font-bold text-accent">{COMMENT_LABELS.title}</h2>
        {comments.length > 0 && <span className="text-xs text-muted-foreground">({comments.length})</span>}
        <button
          type="button"
          onClick={() => setShowAdmin((v) => !v)}
          className="ml-auto text-xs text-muted-foreground hover:text-accent transition-colors">
          {COMMENT_LABELS.adminEntry}
        </button>
      </div>

      {showAdmin && (
        <div className="mb-4 p-3 rounded-lg border border-border bg-muted/40">
          <input
            type="password"
            value={adminToken}
            onChange={(e) => saveAdminToken(e.target.value)}
            placeholder={COMMENT_LABELS.adminTokenPlaceholder}
            className="w-full text-sm bg-transparent text-foreground placeholder-muted-foreground outline-none"
          />
          <p className="text-[11px] text-muted-foreground mt-1.5">{COMMENT_LABELS.adminHint}</p>
        </div>
      )}

      {/* 评论区 */}
      <div className="mb-6">
        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />加载中…
          </p>
        )}

        {!loading && error && (
          <p className="text-sm text-accent-rose py-3" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && comments.length === 0 && (
          <p className="text-sm text-muted-foreground py-3">{COMMENT_LABELS.empty}</p>
        )}

        {!loading && comments.length > 0 && (
          <ul className="flex flex-col gap-3">
            {comments.map((item) => (
              <li key={item.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-medium text-foreground truncate">{item.author}</span>
                  <time className="text-[11px] text-muted-foreground" dateTime={new Date(item.created_at * 1000).toISOString()}>
                    {formatTime(item.created_at)}
                  </time>
                  {adminToken && (
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label={COMMENT_LABELS.delete}
                      className="ml-auto p-1 rounded text-muted-foreground hover:text-accent-rose transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">{item.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 提交表单 */}
      <form
        className="rounded-xl border border-border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}>
        <input
          type="text"
          value={author}
          maxLength={32}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder={COMMENT_LABELS.authorPlaceholder}
          className="w-full text-sm text-foreground placeholder-muted-foreground outline-none bg-transparent mb-3 pb-3 border-b border-border"
        />
        <textarea
          value={content}
          maxLength={500}
          rows={3}
          onChange={(e) => setContent(e.target.value)}
          placeholder={COMMENT_LABELS.contentPlaceholder}
          className="w-full text-sm text-foreground placeholder-muted-foreground outline-none bg-transparent resize-none leading-relaxed"
        />
        <div className="flex items-center justify-between gap-3 mt-3">
          <span className="text-[11px] text-muted-foreground">{content.length}/500</span>
          {submitError && (
            <p className="text-xs text-accent-rose" role="alert">
              {submitError}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || !author.trim() || !content.trim()}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-border bg-muted text-muted-foreground hover:border-accent hover:text-accent transition-colors disabled:opacity-50 disabled:hover:border-border disabled:hover:text-muted-foreground">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{COMMENT_LABELS.submit}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
