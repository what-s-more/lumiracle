/**
 * Agent 工具注册表（M6 / Agent 化）
 *
 * 每个工具 = OpenAI function-calling schema + 边缘执行器。
 * 语义检索复用 retrieve()，阅读统计复用 collectStats()（与 /api/stats 共用同一份 SQL），
 * 评论直查 D1（与 /api/comment 同表同状态口径），文章列表来自构建期生成的 POSTS_META。
 *
 * 工具执行失败不抛出中断循环，而是把错误信息作为结果交回模型——
 * 模型可以据此向用户解释，而不是拿到一个裸 500。
 */

import { retrieve, type RetrievedChunk } from './retrieve';
import { collectStats } from '../api/stats';
import { POSTS_META } from './posts-meta.gen';
import type { ChatEnv } from './types';

/** 工具入参的 JSON Schema 子集（type/properties/required/description） */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute(args: Record<string, unknown>, env: ChatEnv): Promise<unknown>;
}

/** OpenAI tools 格式（Workers AI chat 接口同构） */
export interface OpenAiTool {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

function argString(args: Record<string, unknown>, key: string): string | undefined {
  const v = args[key];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function argNumber(args: Record<string, unknown>, key: string, fallback: number, min: number, max: number): number {
  const v = args[key];
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v ?? ''));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.floor(n), min), max);
}

/* ------------------------------------------------------------------ */
/* search_posts                                                        */
/* ------------------------------------------------------------------ */

/** search_posts 返回的引用来源（供前端 sources 帧） */
export interface SourceRef {
  slug: string;
  title: string;
  anchor: string;
  heading: string;
  score: number;
}

function toSource(c: RetrievedChunk): SourceRef {
  return { slug: c.slug, title: c.title, anchor: c.anchor, heading: c.heading, score: c.score };
}

const searchPosts: ToolDefinition = {
  name: 'search_posts',
  description: '在博客文章内进行语义检索，返回最相关的段落（含来源文章与锚点）。回答与文章内容相关的问题前应先调用本工具。',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: '检索的问题或关键词' },
      slug: { type: 'string', description: '限定在某篇文章内检索（可选）' },
    },
    required: ['query'],
  },
  async execute(args, env) {
    const query = argString(args, 'query');
    if (!query) throw new Error('缺少 query 参数。');
    const slug = argString(args, 'slug');
    const chunks = await retrieve(env, query, { slug, topK: 5 });
    return {
      matches: chunks.map((c) => ({
        slug: c.slug,
        title: c.title,
        heading: c.heading,
        anchor: c.anchor,
        score: Number(c.score.toFixed(4)),
        excerpt: c.text.length > 160 ? `${c.text.slice(0, 160)}…` : c.text,
      })),
      hits: chunks.length,
      sources: chunks.map(toSource),
    };
  },
};

/* ------------------------------------------------------------------ */
/* get_stats                                                           */
/* ------------------------------------------------------------------ */

const getStats: ToolDefinition = {
  name: 'get_stats',
  description: '查询站内最近 N 天的阅读数据：PV/UV 总量、每日趋势、来源分布、文章阅读排行。',
  parameters: {
    type: 'object',
    properties: {
      days: { type: 'number', description: '统计天数（1-90，默认 7）' },
    },
    required: [],
  },
  async execute(args, env) {
    const days = argNumber(args, 'days', 7, 1, 90);
    const agg = await collectStats(env, days);
    return {
      range: agg.range,
      totals: agg.totals,
      topArticles: agg.articles.slice(0, 5),
      topReferrers: agg.referrers.slice(0, 5),
      dailyCount: agg.daily.length,
    };
  },
};

/* ------------------------------------------------------------------ */
/* list_comments                                                       */
/* ------------------------------------------------------------------ */

interface CommentRecord {
  id: number;
  article_slug: string;
  author: string;
  content: string;
  created_at: number;
}

const listComments: ToolDefinition = {
  name: 'list_comments',
  description: '查询站内已发布的读者评论。可按文章 slug 过滤，默认返回最近 10 条（时间倒序）。',
  parameters: {
    type: 'object',
    properties: {
      slug: { type: 'string', description: '限定某篇文章（可选）' },
      limit: { type: 'number', description: '返回条数（1-30，默认 10）' },
    },
    required: [],
  },
  async execute(args, env) {
    const slug = argString(args, 'slug');
    const limit = argNumber(args, 'limit', 10, 1, 30);

    const stmt = slug
      ? env.DB.prepare(
          `SELECT id, article_slug, author, content, created_at
             FROM comments WHERE status = 'approved' AND article_slug = ?
            ORDER BY created_at DESC LIMIT ?`,
        ).bind(slug, limit)
      : env.DB.prepare(
          `SELECT id, article_slug, author, content, created_at
             FROM comments WHERE status = 'approved'
            ORDER BY created_at DESC LIMIT ?`,
        ).bind(limit);

    const rows = await stmt.all<CommentRecord>();
    const results = rows.results ?? [];
    return { count: results.length, comments: results.map((r) => ({
      id: r.id,
      slug: r.article_slug,
      author: r.author,
      content: r.content.length > 100 ? `${r.content.slice(0, 100)}…` : r.content,
      time: new Date(r.created_at * 1000).toISOString().slice(0, 10),
    })) };
  },
};

/* ------------------------------------------------------------------ */
/* list_posts                                                          */
/* ------------------------------------------------------------------ */

const listPosts: ToolDefinition = {
  name: 'list_posts',
  description: '列出站内全部文章的元数据（标题、日期、分类、标签、简介），不包含正文。',
  parameters: { type: 'object', properties: {}, required: [] },
  async execute() {
    return {
      count: POSTS_META.length,
      posts: POSTS_META.map((p) => ({
        slug: p.slug,
        title: p.title,
        date: p.date,
        category: p.category,
        tags: p.tags,
        description: p.description,
      })),
    };
  },
};

/* ------------------------------------------------------------------ */
/* 注册表与执行入口                                                     */
/* ------------------------------------------------------------------ */

export const TOOLS: ToolDefinition[] = [searchPosts, getStats, listComments, listPosts];

const REGISTRY = new Map(TOOLS.map((t) => [t.name, t]));

export function toolSchemas(): OpenAiTool[] {
  return TOOLS.map((t) => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

export interface ToolOutcome {
  /** 交给模型的工具结果（JSON 序列化后作为 tool 消息内容） */
  content: string;
  /** search_posts 命中的引用来源，其余工具为空 */
  sources: SourceRef[];
  /** 给前端展示的一行摘要 */
  summary: string;
}

export async function executeTool(env: ChatEnv, name: string, argsJson: string): Promise<ToolOutcome> {
  const tool = REGISTRY.get(name);
  if (!tool) throw new Error(`未知工具：${name}`);

  let args: Record<string, unknown> = {};
  if (argsJson.trim()) {
    try {
      args = JSON.parse(argsJson) as Record<string, unknown>;
    } catch {
      return {
        content: JSON.stringify({ error: '工具参数不是合法 JSON，请检查参数后重试。' }),
        sources: [],
        summary: `${name} 参数解析失败`,
      };
    }
  }

  try {
    const result = await tool.execute(args, env);
    const sources = name === 'search_posts' && result && typeof result === 'object'
      ? (result as { sources?: SourceRef[] }).sources ?? []
      : [];
    const summary = name === 'search_posts' && result && typeof result === 'object'
      ? `语义检索「${argString(args, 'query') ?? ''}」命中 ${(result as { hits?: number }).hits ?? 0} 条`
      : name === 'get_stats' && result && typeof result === 'object'
        ? `查询阅读统计（${(result as { range?: { days?: number } }).range?.days ?? 7} 天）`
        : name === 'list_comments' && result && typeof result === 'object'
          ? `读取评论 ${(result as { count?: number }).count ?? 0} 条`
          : name === 'list_posts'
            ? `列出文章 ${(result as { count?: number }).count ?? POSTS_META.length} 篇`
            : '执行完成';
    return { content: JSON.stringify(result), sources, summary };
  } catch (err) {
    // 失败也以结构化结果交回模型，由模型向用户解释
    return { content: JSON.stringify({ error: (err as Error).message }), sources: [], summary: `${name} 执行失败` };
  }
}
