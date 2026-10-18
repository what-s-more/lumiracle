import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { ReactNode } from 'react';
import MarkdownImage from './MarkdownImage';
import CodeBlock from './CodeBlock';
// 与索引构建（scripts/lib/chunk.mjs）共用同一套标题锚点算法，保证引用链接能命中段落
import { slugifyHeading } from '../../scripts/lib/chunk.mjs';

interface MarkdownRendererProps {
  content: string;
}

/** 从 React 节点中提取纯文本，用于生成标题锚点。 */
function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  }
  return '';
}

/** 为标题补 `id`（与索引锚点一致），使问答引用可点击跳转到对应段落。 */
function headingWithAnchor(Tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') {
  return function Heading({ children }: { children?: ReactNode }) {
    return <Tag id={slugifyHeading(textOf(children)) || 'top'}>{children}</Tag>;
  };
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <article className="prose prose-amber dark:prose-invert max-w-none
      prose-headings:text-foreground
      prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-4 prose-h1:mt-8
      prose-h2:text-2xl prose-h2:font-semibold prose-h2:mb-3 prose-h2:mt-6
      prose-h3:text-xl prose-h3:font-semibold prose-h3:mb-2 prose-h3:mt-4
      prose-p:text-foreground/80 prose-p:leading-relaxed prose-p:mb-4
      prose-a:text-accent prose-a:no-underline hover:prose-a:underline
      prose-code:text-accent prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:overflow-x-auto
      prose-blockquote:border-l-4 prose-blockquote:border-accent prose-blockquote:italic prose-blockquote:text-muted-foreground
      prose-ul:text-foreground/80 prose-li:mb-1
      prose-strong:text-foreground prose-strong:font-semibold
      prose-hr:border-border
      prose-img:rounded-xl prose-img:shadow-md
    ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: headingWithAnchor('h1'),
          h2: headingWithAnchor('h2'),
          h3: headingWithAnchor('h3'),
          h4: headingWithAnchor('h4'),
          h5: headingWithAnchor('h5'),
          h6: headingWithAnchor('h6'),
          img: ({ src, alt }) => <MarkdownImage src={typeof src === 'string' ? src : ''} alt={alt || ''} />,
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          p: ({ children, node }) => {
            // Check if paragraph contains only an image - if so, render as div to avoid hydration issues
            const childArray = Array.isArray(children) ? children : [children];
            if (childArray.length === 1 && node?.children[0]?.type === 'element' && node?.children[0]?.tagName === 'img') {
              return <>{children}</>;
            }
            return <p>{children}</p>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}