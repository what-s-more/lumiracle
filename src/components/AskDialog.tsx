'use client';

/**
 * 站内问答弹窗（T3 / M1-C）
 *
 * 与 `functions/api/chat.ts` 的 SSE 协议对接：先收到 sources（引用来源），
 * 随后逐段收到 delta 正文，末帧 done；error 帧给出明确提示。
 *
 * 以 window 事件方式对外暴露「打开」能力，因此可以在 layout 中单实例挂载，
 * 由 Header（全站入口）与 PostAsk（文章页内入口）分别触发。
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import { ASK_LABELS } from '@/lib/site-config';

export const ASK_OPEN_EVENT = 'lumiracle:ask-open';

export interface AskOpenDetail {
  /** 传入文章 slug 时检索偏向该文章（文章页内入口） */
  slug?: string;
  title?: string;
}

/** 打开问答弹窗（全站任意位置可调用）。 */
export function openAskDialog(detail: AskOpenDetail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<AskOpenDetail>(ASK_OPEN_EVENT, { detail }));
}

interface Source {
  slug: string;
  title: string;
  anchor: string;
  heading: string;
  score: number;
}

type Status = 'idle' | 'streaming' | 'done' | 'error';

interface SseFrame {
  type: 'sources' | 'delta' | 'error' | 'done';
  sources?: Source[];
  text?: string;
  message?: string;
}

export default function AskDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [scope, setScope] = useState<AskOpenDetail>({});
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const close = useCallback(() => {
    abortRef.current?.abort();
    setIsOpen(false);
  }, []);

  // 监听打开事件
  useEffect(() => {
    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<AskOpenDetail>).detail ?? {};
      setScope(detail);
      setQuestion('');
      setAnswer('');
      setSources([]);
      setError('');
      setStatus('idle');
      setIsOpen(true);
    };
    window.addEventListener(ASK_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(ASK_OPEN_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  // 流式正文滚动跟随
  useEffect(() => {
    if (status === 'streaming' && answerRef.current) {
      answerRef.current.scrollTop = answerRef.current.scrollHeight;
    }
  }, [answer, status]);

  const ask = useCallback(async () => {
    const q = question.trim();
    if (!q || status === 'streaming') return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAnswer('');
    setSources([]);
    setError('');
    setStatus('streaming');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, slug: scope.slug }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        setError(res.status === 400 ? '提问不符合要求，请调整后重试。' : '问答服务暂时不可用，请稍后重试。');
        setStatus('error');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let failed = false;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          let frame: SseFrame;
          try {
            frame = JSON.parse(line.slice(5).trim()) as SseFrame;
          } catch {
            continue;
          }
          if (frame.type === 'sources') setSources(frame.sources ?? []);
          else if (frame.type === 'delta' && frame.text) setAnswer((prev) => prev + frame.text);
          else if (frame.type === 'error') {
            failed = true;
            setError(frame.message || '问答服务暂时不可用，请稍后重试。');
          }
        }
      }

      setStatus(failed ? 'error' : 'done');
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError('网络异常，未能获取回答，请稍后重试。');
      setStatus('error');
    }
  }, [question, scope.slug, status]);

  if (!isOpen) return null;

  const streaming = status === 'streaming';

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
      <div className="relative max-w-2xl mx-auto mt-[10vh] mb-[10vh] px-4">
        <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[80vh] shadow-[0_0_16px_var(--glow)]">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
            <Sparkles className="w-5 h-5 text-accent shrink-0" />
            <span className="text-foreground font-medium">{ASK_LABELS.title}</span>
            {scope.title && (
              <span className="text-xs text-muted-foreground truncate">{ASK_LABELS.scopeHint} · {scope.title}</span>
            )}
            <button type="button" onClick={close}
              className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={answerRef} className="px-5 py-4 overflow-y-auto flex-1">
            {!answer && !error && (
              <p className="text-sm text-muted-foreground text-center py-6">{ASK_LABELS.idleHint}</p>
            )}

            {(answer || (streaming && !error)) && (
              <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">
                {answer}
                {streaming && <span className="ask-caret" />}
              </p>
            )}

            {error && (
              <p className="text-sm text-accent-rose py-2" role="alert">{error}</p>
            )}

            {sources.length > 0 && (
              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">引用来源</p>
                <ul className="flex flex-col gap-1.5">
                  {sources.map((s) => (
                    <li key={`${s.slug}#${s.anchor}`}>
                      <Link href={`/posts/${s.slug}/#${s.anchor}`} onClick={close}
                        className="ask-source-chip">
                        <span className="text-accent">✦</span>
                        <span className="truncate">
                          {s.title}{s.heading && s.heading !== s.title ? ` › ${s.heading}` : ''}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <form
            className="flex items-center gap-3 px-5 py-4 border-t border-border shrink-0"
            onSubmit={(e) => {
              e.preventDefault();
              ask();
            }}>
            <input ref={inputRef} type="text" value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={ASK_LABELS.placeholder}
              className="flex-1 text-foreground placeholder-muted-foreground outline-none text-base bg-transparent" />
            <button type="submit" disabled={streaming || !question.trim()}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-border bg-muted text-muted-foreground hover:border-accent hover:text-accent transition-colors disabled:opacity-50 disabled:hover:border-border disabled:hover:text-muted-foreground">
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{ASK_LABELS.submit}</span>
            </button>
          </form>

          <div className="px-5 pb-3 text-[11px] text-muted-foreground shrink-0">
            {ASK_LABELS.disclaimer}
          </div>
        </div>
      </div>
    </div>
  );
}
