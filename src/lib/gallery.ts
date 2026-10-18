import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface GalleryItem {
  url: string;
  title: string;
  date: string;
}

const galleryDirectory = path.join(process.cwd(), 'data');

export function getGallery(): GalleryItem[] {
  const fullPath = path.join(galleryDirectory, 'gallery.yml');
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  const items = yaml.load(fileContents, { schema: yaml.JSON_SCHEMA }) as GalleryItem[];

  return items.sort((a, b) => (a.date > b.date ? -1 : 1));
}
