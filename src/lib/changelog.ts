import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const dataDirectory = path.join(process.cwd(), 'data');

export interface ChangelogEntry {
  version: string;
  date: string;
  content: string;
}

export function getChangelog(): ChangelogEntry[] {
  const fullPath = path.join(dataDirectory, 'changelog.md');
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const matterResult = matter(fileContents);
  
  return [{
    version: matterResult.data.version as string,
    date: matterResult.data.date as string,
    content: matterResult.content,
  }];
}