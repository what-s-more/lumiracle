'use client';

/**
 * 阅读埋点（T5 / M3）
 *
 * 每次路由变化用 navigator.sendBeacon 上报一条事件，不阻塞渲染；
 * 不支持 sendBeacon 时退回 fetch(keepalive)。
 * 上报目标 /api/stats 由 Pages Functions 写入 D1，看板页读取聚合结果。
 *
 * 纯新增组件：挂载在 layout 内，不影响既有页面结构与视觉。
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/** 从文章页路径取出 slug：/posts/{slug}/ → {slug} */
function slugFromPath(pathname: string): string | null {
  const matched = /^\/posts\/([^/]+)\/?$/.exec(pathname);
  return matched ? decodeURIComponent(matched[1]) : null;
}

function send(payload: string) {
  const blob = new Blob([payload], { type: 'application/json' });
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    if (navigator.sendBeacon('/api/stats', blob)) return;
  }
  // 兜底：keepalive 让请求在页面卸载后仍有机会送达
  void fetch('/api/stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {
    /* 埋点失败静默忽略 */
  });
}

export default function StatsBeacon() {
  const pathname = usePathname();
  const lastSentRef = useRef<string>('');

  useEffect(() => {
    if (!pathname || pathname === lastSentRef.current) return;
    lastSentRef.current = pathname;

    send(
      JSON.stringify({
        path: pathname,
        articleSlug: slugFromPath(pathname),
        referrer: document.referrer || '',
      }),
    );
  }, [pathname]);

  return null;
}
