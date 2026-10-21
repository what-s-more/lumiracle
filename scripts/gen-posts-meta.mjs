#!/usr/bin/env node
/**
 * 生成 functions/lib/posts-meta.gen.ts（Agent 工具 list_posts 的数据源）
 *
 * functions 运行时无法读取文件系统，文章元数据在构建期生成并打包进代码。
 * 产物提交进仓库，保证 functions 单测与类型检查不依赖构建顺序。
 *
 * 用法：node scripts/gen-posts-meta.mjs
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'posts');
const OUT_FILE = path.join(ROOT, 'functions', 'lib', 'posts-meta.gen.ts');

function str(v, fallback = '') {
  return typeof v === 'string' ? v : fallback;
}

const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith('.md')).sort();
const posts = [];
for (const file of files) {
  const slug = file.replace(/\.md$/, '');
  const { data } = matter(await readFile(path.join(POSTS_DIR, file), 'utf8'));
  posts.push({
    slug,
    title: str(data.title, slug),
    date: str(data.date),
    category: str(data.category, '未分类'),
    tags: Array.isArray(data.tags) ? data.tags.map((t) => String(t)) : [],
    description: str(data.description),
  });
}

const banner = `/**
 * 由 scripts/gen-posts-meta.mjs 在构建期生成，请勿手改。
 * 生成时间：${new Date().toISOString()}
 */

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  description: string;
}

export const POSTS_META: PostMeta[] = ${JSON.stringify(posts, null, 2)};
`;

await writeFile(OUT_FILE, banner, 'utf8');
console.log(`posts-meta: ${posts.length} 篇 → ${path.relative(ROOT, OUT_FILE)}`);
