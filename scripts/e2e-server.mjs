#!/usr/bin/env node
/**
 * E2E 静态服务器（T7 / M5）
 *
 * 本地 `wrangler pages dev out` 无法经 miniflare 远程代理 Vectorize/AI/D1 绑定，
 * 因此 Playwright 采用「静态托管 out/ + /api 反向代理」方案：
 *   - 静态路径（首页 / 文章页 / Pagefind 搜索）始终可用，无需任何外部依赖；
 *   - /api/* ：设置 E2E_API_BASE（部署预览域名）时转发到真实边缘函数，
 *     否则一律 503，前端据此对问答/看板断言做跳过（见 e2e/api.spec.ts）。
 *
 * 用法：
 *   npm run build                       # 先生成 out/ 与 /pagefind/
 *   node scripts/e2e-server.mjs         # http://localhost:4330
 *   E2E_API_BASE=https://xxx.pages.dev node scripts/e2e-server.mjs
 */

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(process.cwd(), 'out');
const PORT = Number.parseInt(process.env.E2E_PORT || '4330', 10);
const API_BASE = (process.env.E2E_API_BASE || '').replace(/\/$/, '');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.pf_fragment': 'application/octet-stream',
};

/** 静态导出为目录形式（/posts/x/ → posts/x/index.html），依次尝试候选文件。 */
async function findFile(pathname) {
  const decoded = decodeURIComponent(pathname.split('?')[0]);
  const clean = normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const candidates =
    clean.endsWith('/')
      ? [join(ROOT, clean, 'index.html')]
      : [join(ROOT, clean), join(ROOT, clean, 'index.html'), join(ROOT, `${clean}.html`)];

  for (const file of candidates) {
    if (!file.startsWith(ROOT)) continue; // 防目录穿越
    try {
      if ((await stat(file)).isFile()) return file;
    } catch {
      // 不存在则试下一个候选
    }
  }
  return null;
}

function readBody(req) {
  return new Promise((resolvePromise, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolvePromise(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function proxyApi(req, res, url) {
  if (!API_BASE) {
    res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'E2E_API_BASE 未设置，本地未代理边缘接口。' }));
    return;
  }
  const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await readBody(req);
  try {
    const upstream = await fetch(`${API_BASE}${url.pathname}${url.search}`, {
      method: req.method,
      headers: { 'Content-Type': req.headers['content-type'] || 'application/json' },
      body,
    });
    res.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: `代理失败：${err.message}` }));
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  if (url.pathname.startsWith('/api/')) {
    await proxyApi(req, res, url);
    return;
  }

  const file = (await findFile(url.pathname)) || (await findFile('/404.html'));
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  const api = API_BASE ? `api → ${API_BASE}` : 'api disabled（仅静态断言）';
  console.log(`[e2e] 静态服务器已启动：http://localhost:${PORT}（${api}）`);
});
