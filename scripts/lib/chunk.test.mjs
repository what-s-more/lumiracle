import { describe, it, expect } from 'vitest';
import { chunkMarkdown, parseSections, slugifyHeading, estimateTokens } from './chunk.mjs';

describe('estimateTokens', () => {
  it('CJK 字符权重高于等长 ASCII', () => {
    expect(estimateTokens('中文中文')).toBeGreaterThan(estimateTokens('abcd'));
  });

  it('空文本为 0', () => {
    expect(estimateTokens('')).toBe(0);
  });
});

describe('slugifyHeading', () => {
  it('保留 CJK，去除标点并转小写连字符', () => {
    expect(slugifyHeading('关键配置项')).toBe('关键配置项');
    expect(slugifyHeading("output: 'export'")).toBe('output-export');
    expect(slugifyHeading('trailingSlash: true')).toBe('trailingslash-true');
    expect(slugifyHeading('方法一：Dashboard 部署')).toBe('方法一dashboard-部署');
  });
});

describe('parseSections', () => {
  it('代码块内的 # 不会被当作标题', () => {
    const md = ['## 配置', '', '```bash', '# 这是注释', '```'].join('\n');
    const sections = parseSections(md).filter((s) => s.heading);
    expect(sections).toHaveLength(1);
    expect(sections[0].heading.text).toBe('配置');
  });

  it('记录标题层级路径', () => {
    const md = ['# 标题', '', '## A', '', '正文', '', '### B', '', '正文'].join('\n');
    const sections = parseSections(md).filter((s) => s.heading);
    expect(sections.map((s) => s.heading.path)).toEqual([['标题'], ['标题', 'A'], ['标题', 'A', 'B']]);
  });
});

describe('chunkMarkdown', () => {
  const md = [
    '---',
    'title: 示例',
    '---',
    '# 示例文章',
    '',
    '导语段落。',
    '',
    '## 第一节',
    '',
    '第一节正文。',
    '',
    '### 小节',
    '',
    '小节正文。',
  ].join('\n').replace(/^---[\s\S]*?---\n/, '');

  it('每块带文档标题前缀与唯一 id', () => {
    const chunks = chunkMarkdown(md, { slug: 'demo', title: '示例文章' });
    expect(chunks.length).toBeGreaterThan(0);
    const ids = chunks.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of chunks) {
      expect(c.text.startsWith('示例')).toBe(true);
      expect(c.slug).toBe('demo');
    }
  });

  it('子标题块保留层级路径作为上下文', () => {
    const chunks = chunkMarkdown(md, { slug: 'demo', title: '示例文章' });
    const heading = chunks.map((c) => c.heading);
    expect(heading).toContain('第一节');
    expect(heading).toContain('第一节 › 小节');
  });

  it('纯标题无正文的区块被跳过', () => {
    const chunks = chunkMarkdown('# 标题\n\n## 空小节\n\n## 有正文\n\n内容', {
      slug: 'x',
      title: '标题',
    });
    expect(chunks.map((c) => c.heading)).toEqual(['有正文']);
  });
});
