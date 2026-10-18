/**
 * 文章切分模块（T1 / M1-A）
 *
 * 按 Markdown 标题层级切分文章（保留标题路径作为上下文前缀），
 * 而非按固定长度硬切，以提升语义检索质量。
 *
 * 纯 ESM、无运行时依赖，可被 T7 的 Vitest 单测直接引用。
 */

const CJK_RE = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3040-\u30FF\uAC00-\uD7AF]/g;

// 目标块大小 300–500 token（与方案 §三 M1 一致）
const TARGET_TOKENS = 400;
const MAX_TOKENS = 500;

/**
 * 估算 token 数：CJK 字符按 1 token/字，其余按 4 字符/token。
 * 仅用于切分决策，无需与模型分词器完全一致。
 */
export function estimateTokens(text) {
  if (!text) return 0;
  const cjk = (text.match(CJK_RE) || []).length;
  const other = Math.max(0, text.length - cjk);
  return Math.ceil(cjk + other / 4);
}

/**
 * 生成 GitHub 风格的标题锚点（保留 CJK，去除行内标记与标点）。
 */
export function slugifyHeading(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * 按行解析文章，切出「标题 + 该标题下的正文」区块。
 * 代码块（``` 围栏）内的 `#` 不会被误判为标题。
 */
export function parseSections(markdown) {
  const lines = String(markdown).split(/\r?\n/);
  const sections = [];
  const stack = []; // 标题层级栈：{ level, text }
  let current = { heading: null, lines: [] };
  let inCode = false;

  for (const line of lines) {
    if (/^\s*```/.test(line)) inCode = !inCode;

    const heading = !inCode && /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      if (current.heading || current.lines.join('').trim()) sections.push(current);
      const level = heading[1].length;
      const text = heading[2].trim();
      while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
      stack.push({ level, text });
      current = { heading: { level, text, path: stack.map((s) => s.text) }, lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  sections.push(current);

  return sections;
}

/**
 * 将区块正文切为「段落 / 代码块」列表（空行分段，代码块整体保留）。
 */
function splitBlocks(lines) {
  const blocks = [];
  let buf = [];
  let inCode = false;

  const flush = () => {
    const text = buf.join('\n').trim();
    if (text) blocks.push(text);
    buf = [];
  };

  for (const line of lines) {
    if (/^\s*```/.test(line)) inCode = !inCode;
    if (!inCode && line.trim() === '') {
      flush();
      continue;
    }
    buf.push(line);
  }
  flush();

  return blocks;
}

/**
 * 超长单块（无空行可切）时按行贪心硬切。
 */
function hardSplit(block) {
  const pieces = [];
  let buf = [];
  let tokens = 0;
  for (const line of block.split('\n')) {
    const t = estimateTokens(line);
    if (tokens > 0 && tokens + t > MAX_TOKENS) {
      pieces.push(buf.join('\n').trim());
      buf = [];
      tokens = 0;
    }
    buf.push(line);
    tokens += t;
  }
  if (buf.length) pieces.push(buf.join('\n').trim());
  return pieces.filter(Boolean);
}

/**
 * 切分入口。
 *
 * @param {string} markdown 正文（不含 frontmatter）
 * @param {{ slug?: string, title?: string }} meta 文章元信息
 * @returns {Array<{ id: string, slug: string, anchor: string, title: string, heading: string, text: string, tokens: number }>}
 */
export function chunkMarkdown(markdown, meta = {}) {
  const slug = meta.slug || '';
  const docTitle = meta.title || slug;
  const sections = parseSections(markdown);
  const chunks = [];

  for (const section of sections) {
    const headingText = section.heading?.text || docTitle;
    const anchor = slugifyHeading(headingText) || 'top';

    // 标题路径去掉与文档标题重复的首项，例如 [文档标题, 配置] → [配置]
    let headingPath = section.heading?.path ?? [];
    if (headingPath.length && headingPath[0] === docTitle) headingPath = headingPath.slice(1);

    const body = section.lines.join('\n').trim();
    if (!body) continue; // 纯标题无正文，跳过

    // 顶层区块（标题即文档标题）不再重复拼接，仅用文档标题作前缀
    const prefix = headingPath.length ? `${docTitle} › ${headingPath.join(' › ')}` : docTitle;

    // 贪心合并段落至 TARGET_TOKENS
    const parts = [];
    let buf = [];
    let bufTokens = 0;
    const flush = () => {
      if (buf.length) {
        parts.push(buf.join('\n\n'));
        buf = [];
        bufTokens = 0;
      }
    };

    for (const block of splitBlocks(section.lines)) {
      const t = estimateTokens(block);
      if (t > MAX_TOKENS) {
        flush();
        for (const piece of hardSplit(block)) parts.push(piece);
        continue;
      }
      if (bufTokens > 0 && bufTokens + t > MAX_TOKENS) flush();
      buf.push(block);
      bufTokens += t;
      if (bufTokens >= TARGET_TOKENS) flush();
    }
    flush();

    parts.forEach((part, index) => {
      const id = index === 0 ? `${slug}#${anchor}` : `${slug}#${anchor}-${index}`;
      const text = `${prefix}\n\n${part}`;
      chunks.push({
        id,
        slug,
        anchor,
        title: docTitle,
        heading: headingPath.length ? headingPath.join(' › ') : docTitle,
        text,
        tokens: estimateTokens(text),
      });
    });
  }

  return chunks;
}
