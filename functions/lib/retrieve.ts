/**
 * 检索模块（T2 / M1-B）
 *
 * 问题 → embedding → Vectorize topK 查询 → 返回带来源的命中块。
 * 命中块的正文来自索引 metadata.text（由 scripts/build-index.mjs 写入）。
 */

import type { ChatEnv, VectorizeMatch } from './types';

export const EMBED_MODEL = '@cf/baai/bge-m3';
export const TOP_K = 5;

export interface RetrievedChunk {
  id: string;
  score: number;
  slug: string;
  title: string;
  anchor: string;
  heading: string;
  text: string;
}

/** 单条检索结果的最小可用性：有 slug 且有正文才可用于组装上下文。 */
function toChunk(match: VectorizeMatch): RetrievedChunk | null {
  const meta = match.metadata || {};
  const slug = typeof meta.slug === 'string' ? meta.slug : '';
  const text = typeof meta.text === 'string' ? meta.text : '';
  if (!slug || !text) return null;
  return {
    id: match.id,
    score: typeof match.score === 'number' ? match.score : 0,
    slug,
    title: typeof meta.title === 'string' ? meta.title : slug,
    anchor: typeof meta.anchor === 'string' ? meta.anchor : 'top',
    heading: typeof meta.heading === 'string' ? meta.heading : '',
    text,
  };
}

/** 计算问题的向量表示。失败时抛出，由调用方转为明确提示。 */
export async function embedQuestion(env: ChatEnv, question: string): Promise<number[]> {
  const out = await env.AI.run(EMBED_MODEL, { text: [question] });
  const data = (out as { data?: unknown })?.data;
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error('embedding 返回结构异常');
  }
  const vector = data[0] as number[];
  if (!vector.length) throw new Error('embedding 返回空向量');
  return vector;
}

export interface RetrieveOptions {
  topK?: number;
  /** 传入文章 slug 时优先在该文章内检索（T3 文章页内问答），无命中再回退全站。 */
  slug?: string;
}

/**
 * 检索与问题最相关的资料块。
 * 返回按相关度降序的命中块；无命中时返回空数组（由调用方给出「资料不足」提示）。
 */
export async function retrieve(
  env: ChatEnv,
  question: string,
  options: RetrieveOptions = {},
): Promise<RetrievedChunk[]> {
  const topK = options.topK ?? TOP_K;
  const vector = await embedQuestion(env, question);

  const query = (filter?: Record<string, unknown>) =>
    env.VECTORIZE.query(vector, {
      topK,
      returnMetadata: 'all',
      returnValues: false,
      ...(filter ? { filter } : {}),
    });

  let matches: VectorizeMatch[] = [];
  if (options.slug) {
    const scoped = await query({ slug: { $eq: options.slug } });
    matches = scoped.matches ?? [];
  }
  if (!matches.length) {
    const global = await query();
    matches = global.matches ?? [];
  }

  return matches
    .map(toChunk)
    .filter((c): c is RetrievedChunk => c !== null)
    .sort((a, b) => b.score - a.score);
}
