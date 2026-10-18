/**
 * 全文检索客户端（T4 / M2）
 *
 * 关键词精确检索 = Pagefind（构建期生成的静态索引，客户端零后端请求）；
 * 自然语言问答 = AskDialog → /api/chat（RAG）。两者职责互不重叠。
 *
 * Pagefind 的 /pagefind/ 目录由 `next build && pagefind --site out` 在构建后生成，
 * 因而不参与打包：这里用运行时动态 import 加载，避免构建期解析失败。
 */

export interface SearchHit {
  /** 文章 slug（非文章页为空字符串） */
  slug: string;
  url: string;
  title: string;
  /** 含 <mark> 高亮标记的 HTML 片段 */
  excerpt: string;
}

interface PagefindResultData {
  url: string;
  excerpt: string;
  meta?: Record<string, string>;
}

interface PagefindModule {
  options(options: Record<string, unknown>): void;
  search(query: string): Promise<{ results: Array<{ data(): Promise<PagefindResultData> }> }>;
}

/** 运行时动态 import，绕开打包器的静态解析 */
const runtimeImport = new Function('p', 'return import(p)') as (p: string) => Promise<PagefindModule>;

let pagefindPromise: Promise<PagefindModule | null> | null = null;

function loadPagefind(): Promise<PagefindModule | null> {
  if (!pagefindPromise) {
    pagefindPromise = runtimeImport('/pagefind/pagefind.js')
      .then((mod) => {
        mod.options({ basePath: '/pagefind/' });
        return mod;
      })
      .catch(() => {
        console.warn('[search] 未找到 Pagefind 索引，请先执行 npm run build 生成 /pagefind/。');
        return null;
      });
  }
  return pagefindPromise;
}

/** 从 Pagefind 结果 URL 中取出文章 slug。 */
export function slugFromUrl(url: string): string {
  const matched = /^\/posts\/([^/?#]+)\//.exec(url);
  return matched ? decodeURIComponent(matched[1]) : '';
}

/**
 * 检索文章。索引未就绪时返回空数组（不抛错，调用方按「无结果」展示）。
 */
export async function searchPosts(query: string, limit = 8): Promise<SearchHit[]> {
  const keyword = query.trim();
  if (!keyword) return [];

  const pagefind = await loadPagefind();
  if (!pagefind) return [];

  const { results } = await pagefind.search(keyword);
  const top = results.slice(0, limit);
  const data = await Promise.all(top.map((result) => result.data()));

  return data.map((item) => ({
    slug: slugFromUrl(item.url),
    url: item.url,
    title: item.meta?.title || slugFromUrl(item.url),
    excerpt: item.excerpt,
  }));
}
