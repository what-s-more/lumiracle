import { describe, it, expect } from 'vitest';
import { slugFromUrl } from './search';

describe('slugFromUrl', () => {
  it('从文章页 URL 提取 slug', () => {
    expect(slugFromUrl('/posts/hello-world/')).toBe('hello-world');
    expect(slugFromUrl('/posts/nextjs-static-export/')).toBe('nextjs-static-export');
  });

  it('对非文章页 URL 返回空串', () => {
    expect(slugFromUrl('/about/')).toBe('');
    expect(slugFromUrl('/')).toBe('');
    expect(slugFromUrl('/categories/nextjs/')).toBe('');
  });

  it('对含编码与查询串的 slug 做解码', () => {
    expect(slugFromUrl('/posts/%E4%B8%AD%E6%96%87/?q=1')).toBe('中文');
  });
});
