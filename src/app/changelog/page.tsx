import fs from 'fs';
import path from 'path';
import { History, Sparkles, Wrench, Palette } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '魔法记录 - Lumiracle',
  description: '网站更新记录',
};

interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    type: 'feature' | 'improve' | 'fix';
    text: string;
  }[];
}

function parseChangelog(): ChangelogEntry[] {
  const fullPath = path.join(process.cwd(), 'data', 'changelog.md');
  const content = fs.readFileSync(fullPath, 'utf8');
  const entries: ChangelogEntry[] = [];
  
  const entryRegex = /---\nversion:\s*"([^"]+)"\ndate:\s*"([^"]+)"\n---\n([\s\S]*?)(?=\n---|$)/g;
  let match;
  
  while ((match = entryRegex.exec(content)) !== null) {
    const [, version, date, changesText] = match;
    const changes: { type: 'feature' | 'improve' | 'fix'; text: string }[] = [];
    
    const changeRegex = /-\s*\[\s*(feature|improve|fix)\s*\]\s*(.+)/g;
    let changeMatch;
    
    while ((changeMatch = changeRegex.exec(changesText)) !== null) {
      const [, type, text] = changeMatch;
      changes.push({
        type: type as 'feature' | 'improve' | 'fix',
        text: text.trim(),
      });
    }
    
    if (changes.length > 0) {
      entries.push({ version, date, changes });
    }
  }
  
  return entries;
}

const changelog = parseChangelog();

const typeStyles = {
  feature: 'bg-accent/10 text-accent',
  improve: 'bg-accent-secondary/10 text-accent-secondary',
  fix: 'bg-accent-rose/10 text-accent-rose',
};

const typeLabels = {
  feature: '新增',
  improve: '优化',
  fix: '修复',
};

const typeIcons = {
  feature: Sparkles,
  improve: Wrench,
  fix: Palette,
};

export default function ChangelogPage() {
  return (
    <div className="relative z-10">
      <div className="bg-gradient-to-br from-amber-50/80 via-background to-orange-50/50 dark:from-indigo-950/50 dark:via-background dark:to-purple-950/30 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium mb-6">
            <History className="w-4 h-4" />
            魔法记录
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            网站更新记录
          </h1>
          <p className="text-lg text-muted-foreground">
            记录每一次迭代与改进
          </p>
        </div>
      </div>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {changelog.map((entry) => (
          <div key={entry.version} className="mb-12 last:mb-0">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-accent-secondary text-white flex items-center justify-center text-lg font-bold shrink-0 version-badge-pulse">
                {entry.version}
              </div>
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-sm text-muted-foreground shrink-0">
                {entry.date}
              </span>
            </div>

            <div className="ml-7 timeline-dashed-beam pl-8 space-y-3">
              {entry.changes.map((change, i) => {
                const Icon = typeIcons[change.type];
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-3 px-4 -ml-4 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-foreground">{change.text}</span>
                    <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium shrink-0 ${typeStyles[change.type]}`}>
                      {typeLabels[change.type]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}