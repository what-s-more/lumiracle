import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { calculateReadingTime } from './reading-time';

const postsDirectory = path.join(process.cwd(), 'posts');

export interface PostMetadata {
  slug: string;
  title: string;
  date: string;
  description: string;
  category: string;
  tags: string[];
  featured?: boolean;
  readingTime?: number;
}

export interface Post extends PostMetadata {
  content: string;
  readingTime: number;
}

export interface CategoryInfo {
  name: string;
  count: number;
}

export interface SearchIndexItem {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
}

function getRawPostsData(): PostMetadata[] {
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, '');
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);
    const readingTime = calculateReadingTime(matterResult.content);

    return {
      slug,
      readingTime,
      ...(matterResult.data as { title: string; date: string; description: string; category: string; tags: string[]; featured?: boolean }),
    };
  });

  return allPostsData.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return a.date < b.date ? 1 : -1;
  });
}

export function getSortedPostsData(): PostMetadata[] {
  return getRawPostsData();
}

export function getFeaturedPosts(): PostMetadata[] {
  return getRawPostsData().filter((post) => post.featured === true);
}

export function getNonFeaturedPosts(): PostMetadata[] {
  return getRawPostsData().filter((post) => !post.featured);
}

export function getAllPostSlugs(): string[] {
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames.map((fileName) => {
    return fileName.replace(/\.md$/, '');
  });
}

export function getPostData(slug: string): Post {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const matterResult = matter(fileContents);
  const readingTime = calculateReadingTime(matterResult.content);

  return {
    slug,
    content: matterResult.content,
    readingTime,
    ...(matterResult.data as { title: string; date: string; description: string; category: string; tags: string[]; featured?: boolean }),
  };
}

export function getCategories(): CategoryInfo[] {
  const posts = getRawPostsData();
  const categoryMap = new Map<string, number>();

  posts.forEach((post) => {
    const count = categoryMap.get(post.category) || 0;
    categoryMap.set(post.category, count + 1);
  });

  return Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getPostsByCategory(category: string): PostMetadata[] {
  return getRawPostsData().filter(
    (post) => post.category.toLowerCase() === category.toLowerCase()
  );
}

export function getAllCategorySlugs(): string[] {
  const categories = getCategories();
  return categories.map((cat) => cat.name.toLowerCase().replace(/\s+/g, '-'));
}

export function getPostsGroupedByYear(): Record<string, PostMetadata[]> {
  const posts = getRawPostsData();
  const grouped: Record<string, PostMetadata[]> = {};

  posts.forEach((post) => {
    const year = post.date.split('-')[0];
    if (!grouped[year]) {
      grouped[year] = [];
    }
    grouped[year].push(post);
  });

  Object.keys(grouped).forEach((year) => {
    grouped[year].sort((a, b) => (a.date < b.date ? 1 : -1));
  });

  return grouped;
}

export function getSearchIndex(): SearchIndexItem[] {
  return getRawPostsData().map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    category: post.category,
    tags: post.tags,
  }));
}
