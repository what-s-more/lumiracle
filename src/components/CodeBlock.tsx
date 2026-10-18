'use client';

import { useState, useCallback, useRef, type ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  children: ReactNode;
}

export default function CodeBlock({ children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = useCallback(() => {
    if (!preRef.current) return;
    const code = preRef.current.querySelector('code');
    const text = code?.textContent ?? preRef.current.textContent ?? '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <div className="group relative">
      <pre ref={preRef} className="!mb-0 !rounded-b-lg !rounded-t-none">
        {children}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-white/20 hover:text-gray-200 transition-all duration-200"
        aria-label="复制代码"
      >
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}
