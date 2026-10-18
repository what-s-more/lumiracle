import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import MarkdownImage from './MarkdownImage';
import CodeBlock from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
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