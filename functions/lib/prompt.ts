/**
 * 提示词模板（T2 / M1-B）
 *
 * 强约束「只基于给定资料回答」，把命中块连同来源标题拼装为上下文，
 * 以便生成结果可回溯到文章锚点（红线 2：引用必须可点验）。
 */

import type { RetrievedChunk } from './retrieve';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const SYSTEM_PROMPT = `你是 Lumiracle 博客的站内问答助手。必须严格遵守以下规则：

1. 只依据「参考资料」回答，禁止使用资料之外的知识，禁止推测、扩写或编造。
2. 资料不足以回答时，直接说明「根据现有资料无法回答该问题」，并简要指出缺少什么信息。
3. 回答使用简体中文，条理清晰；涉及配置或代码时给出资料中的具体片段。
4. 引用资料时在对应句子末尾标注来源，格式为 [来源: 文章标题 › 小节]。
5. 不要提及「参考资料」「上下文」等字眼，直接作答。`;

export const NO_MATCH_REPLY = '根据现有资料无法回答该问题。可以换一种问法，或先浏览站内的相关文章。';

/** 把命中块拼装为带来源标注的上下文文本。 */
export function buildContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map((c, i) => {
      const section = c.heading || c.title;
      return `【资料 ${i + 1}】${c.title}${section && section !== c.title ? ` › ${section}` : ''}（/posts/${c.slug}#${c.anchor}）\n${c.text}`;
    })
    .join('\n\n---\n\n');
}

/** 组装完整对话消息。 */
export function buildMessages(question: string, chunks: RetrievedChunk[]): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `【参考资料】\n${buildContext(chunks)}\n\n【问题】\n${question}`,
    },
  ];
}
