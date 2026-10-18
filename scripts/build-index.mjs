#!/usr/bin/env node
/**
 * M1 索引构建脚本（T1）
 *
 * 遍历 posts/**\/*.md → 按标题层级切分 → Workers AI embedding → upsert Vectorize。
 * 通过 Cloudflare REST API 访问 Workers AI 与 Vectorize，因此可在 CI（T7 索引重建 job）中直接运行。
 *
 * 用法：
 *   node scripts/build-index.mjs --dry-run        # 本地校验切分结果，无需云端凭据
 *   node scripts/build-index.mjs                  # 全量重建（默认先清空索引再写入）
 *   node scripts/build-index.mjs --no-prune       # 增量 upsert，不删除已有向量
 *
 * 环境变量（写入模式必需）：
 *   CF_ACCOUNT_ID / CF_API_TOKEN（或 CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN）
 *   VECTORIZE_INDEX  默认 posts
 *   EMBED_MODEL      默认 @cf/baai/bge-m3（1024 维）
 *   EMBED_DIM        默认 1024
 */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { chunkMarkdown } from './lib/chunk.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'posts');

const ACCOUNT_ID = process.env.CF_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
const INDEX_NAME = process.env.VECTORIZE_INDEX || 'posts';
const EMBED_MODEL = process.env.EMBED_MODEL || '@cf/baai/bge-m3';
const EMBED_DIM = Number(process.env.EMBED_DIM || 1024);
const BATCH = 50;
const MAX_ID_BYTES = 64;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const PRUNE = !args.has('--no-prune');

function djb2(str) {
  let h = 5381;
  for (const ch of str) h = ((h << 5) + h + ch.codePointAt(0)) >>> 0;
  return h.toString(16);
}

/** Vectorize 向量 id 上限 64 字节；超出时降级为 ascii 前缀 + 内容哈希（保持确定性、可幂等）。 */
function safeId(base) {
  if (Buffer.byteLength(base, 'utf8') <= MAX_ID_BYTES) return base;
  const ascii = base.replace(/[^\x00-\x7F]/g, '').slice(0, 40);
  return `${ascii}-${djb2(base)}`.slice(0, MAX_ID_BYTES);
}

async function loadChunks() {
  const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith('.md'));
  const chunks = [];
  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const raw = await readFile(path.join(POSTS_DIR, file), 'utf8');
    const { data, content } = matter(raw);
    const postChunks = chunkMarkdown(content, { slug, title: data.title || slug });
    for (const c of postChunks) chunks.push({ ...c, id: safeId(c.id) });
  }
  return chunks;
}

function cfFetch(apiPath, init = {}) {
  return fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}${apiPath}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      ...(init.headers || {}),
    },
  });
}

async function embed(texts) {
  const res = await cfFetch(`/ai/run/${EMBED_MODEL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: texts }),
  });
  if (!res.ok) throw new Error(`embedding 请求失败 ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const vectors = json?.result?.data ?? json?.result;
  if (!Array.isArray(vectors) || !Array.isArray(vectors[0])) {
    throw new Error(`embedding 返回结构异常: ${JSON.stringify(json).slice(0, 200)}`);
  }
  return vectors;
}

async function upsertVectors(vectors) {
  const body = vectors.map((v) => JSON.stringify(v)).join('\n');
  const res = await cfFetch(`/vectorize/v2/indexes/${INDEX_NAME}/upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-ndjson' },
    body,
  });
  if (!res.ok) throw new Error(`upsert 失败 ${res.status}: ${await res.text()}`);
  return res.json();
}

async function listVectorIds() {
  const ids = [];
  let cursor;
  do {
    const params = new URLSearchParams({ count: '1000' });
    if (cursor) params.set('cursor', cursor);
    const res = await cfFetch(`/vectorize/v2/indexes/${INDEX_NAME}/list?${params}`);
    if (!res.ok) throw new Error(`list 失败 ${res.status}: ${await res.text()}`);
    const json = await res.json();
    const vectors = json?.result?.vectors ?? json?.result ?? [];
    for (const v of vectors) if (v?.id) ids.push(v.id);
    cursor = json?.result_info?.cursor ?? json?.result?.cursor ?? null;
  } while (cursor);
  return ids;
}

async function deleteByIds(ids) {
  for (let i = 0; i < ids.length; i += 1000) {
    const slice = ids.slice(i, i + 1000);
    const res = await cfFetch(`/vectorize/v2/indexes/${INDEX_NAME}/delete-by-ids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: slice }),
    });
    if (!res.ok) throw new Error(`delete-by-ids 失败 ${res.status}: ${await res.text()}`);
  }
}

async function main() {
  const chunks = await loadChunks();
  const totalTokens = chunks.reduce((sum, c) => sum + c.tokens, 0);

  console.log(`切分完成：${chunks.length} 块，共约 ${totalTokens} tokens`);
  const byPost = {};
  for (const c of chunks) byPost[c.slug] = (byPost[c.slug] || 0) + 1;
  for (const [slug, count] of Object.entries(byPost)) console.log(`  - ${slug}: ${count} 块`);

  if (!chunks.length) throw new Error('未生成任何切分块，请检查 posts/ 目录');

  if (DRY_RUN) {
    console.log('\n[dry-run] 前 2 块预览：');
    for (const c of chunks.slice(0, 2)) {
      console.log(`\n--- id=${c.id} (${c.tokens} tokens, anchor=${c.anchor})\n${c.text.slice(0, 300)}`);
    }
    console.log('\n[dry-run] 未写入 Vectorize。');
    return;
  }

  if (!ACCOUNT_ID || !API_TOKEN) {
    console.error('缺少 CF_ACCOUNT_ID / CF_API_TOKEN，无法写入 Vectorize；本地校验请加 --dry-run。');
    process.exit(1);
  }

  if (PRUNE) {
    const existing = await listVectorIds();
    console.log(`清空旧索引：${existing.length} 个向量`);
    if (existing.length) await deleteByIds(existing);
  }

  let written = 0;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const slice = chunks.slice(i, i + BATCH);
    const vectors = await embed(slice.map((c) => c.text));
    if (vectors.length !== slice.length) {
      throw new Error(`embedding 数量不匹配：期望 ${slice.length}，实际 ${vectors.length}`);
    }
    if (vectors[0].length !== EMBED_DIM) {
      console.warn(`⚠️ 向量维度 ${vectors[0].length} 与配置 ${EMBED_DIM} 不一致，请核对索引维度`);
    }
    await upsertVectors(
      slice.map((c, k) => ({
        id: c.id,
        values: vectors[k],
        metadata: { slug: c.slug, title: c.title, anchor: c.anchor, heading: c.heading },
      })),
    );
    written += slice.length;
    console.log(`已写入 ${written}/${chunks.length}`);
  }

  console.log(`✅ 索引重建完成：${written} 个向量写入 "${INDEX_NAME}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
