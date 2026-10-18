import { describe, it, expect } from 'vitest';
import { SYSTEM_PROMPT, NO_MATCH_REPLY, buildContext, buildMessages } from './prompt';
import type { RetrievedChunk } from './retrieve';

const chunk = (over: Partial<RetrievedChunk> = {}): RetrievedChunk => ({
  id: 'hello-world#config',
  score: 0.9,
  slug: 'hello-world',
  title: 'Hello World',
  anchor: 'config',
  heading: '关键配置',
  text: '导语正文',
  ...over,
});

describe('SYSTEM_PROMPT', () => {
  it('包含「只依据资料」与「无法回答」两类硬约束', () => {
    expect(SYSTEM_PROMPT).toContain('只依据');
    expect(SYSTEM_PROMPT).toContain('无法回答');
    expect(NO_MATCH_REPLY).toContain('无法回答');
  });
});

describe('buildContext', () => {
  it('每条命中带标题路径与可点验锚点链接', () => {
    const ctx = buildContext([chunk()]);
    expect(ctx).toContain('【资料 1】Hello World › 关键配置');
    expect(ctx).toContain('（/posts/hello-world#config）');
    expect(ctx).toContain('导语正文');
  });

  it('小节与标题同名时不重复拼接，空命中返回空串', () => {
    const same = buildContext([chunk({ heading: 'Hello World' })]);
    expect(same).toContain('【资料 1】Hello World（');
    expect(same).not.toContain('Hello World › Hello World');
    expect(buildContext([])).toBe('');
  });

  it('多命中以分隔线连接并递增编号', () => {
    const ctx = buildContext([chunk(), chunk({ id: 'b', slug: 'b', title: 'B' })]);
    expect(ctx).toContain('【资料 1】');
    expect(ctx).toContain('【资料 2】');
    expect(ctx).toContain('\n\n---\n\n');
  });
});

describe('buildMessages', () => {
  it('首条为 system，次条为携带资料与问题的 user', () => {
    const messages = buildMessages('怎么配置？', [chunk()]);
    expect(messages).toHaveLength(2);
    expect(messages[0]).toEqual({ role: 'system', content: SYSTEM_PROMPT });
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toContain('【参考资料】');
    expect(messages[1].content).toContain('【问题】\n怎么配置？');
  });
});
