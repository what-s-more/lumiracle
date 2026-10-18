export const SITE_BIRTH_DATE = new Date('2026-05-24');
export const VISITOR_PAGE_ID = 'nextjs-blog';
export const SITE_NAME = 'Lumiracle';
export const SITE_DESCRIPTION = '光之奇迹 · 记录与存档';
export const SITE_SUBTITLE = '光之奇迹';

export const NAV_LINKS = [
  { href: '/', label: '星穹殿堂' },
  { href: '/categories/', label: '魔法书库' },
  { href: '/archive/', label: '时光回廊' },
  { href: '/changelog/', label: '魔法记录' },
  { href: '/about/', label: '守护者之室' },
] as const;

export const FOOTER_LABELS = {
  loadTime: '魔法充能',
  runningDays: '本站已守护',
} as const;

/** 站内 RAG 问答（T3）文案 */
export const ASK_LABELS = {
  entry: '星辉问询',
  title: '星辉问询',
  placeholder: '向书卷提问…',
  submit: '提问',
  idleHint: '基于站内文章回答，并标注引用来源',
  scopeHint: '范围：本文',
  disclaimer: '回答由 AI 依据站内文章生成，请以原文为准',
} as const;
