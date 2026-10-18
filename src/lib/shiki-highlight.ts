import { codeToHtml } from 'shiki';

const theme = 'github-dark';

const langAliases: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  shell: 'bash',
  sh: 'bash',
  yml: 'yaml',
  md: 'markdown',
};

function resolveLang(lang: string): string {
  const lower = lang.toLowerCase();
  return langAliases[lower] || lower;
}

export async function highlightMarkdown(content: string): Promise<string> {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;

  const replacements: Promise<{ original: string; replacement: string }>[] = [];

  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const lang = resolveLang(match[1] || 'plaintext');
    const code = match[2].trimEnd();
    const original = match[0];

    replacements.push(
      codeToHtml(code, { lang, theme })
        .then((html) => ({ original, replacement: html }))
        .catch(() => ({ original, replacement: `<pre><code>${escapeHtml(code)}</code></pre>` }))
    );
  }

  const results = await Promise.all(replacements);

  let result = content;
  for (const { original, replacement } of results) {
    result = result.replace(original, replacement);
  }

  return result;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
