import { getGallery } from '@/lib/gallery';
import { Camera } from 'lucide-react';
import GalleryGrid from '@/components/GalleryGrid';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '时光回廊 - Lumiracle',
  description: '光影留存的瞬间',
};

export default function ArchivePage() {
  const gallery = getGallery();

  return (
    <div className="relative z-10">
      <div className="bg-gradient-to-br from-amber-50/80 via-background to-orange-50/50 dark:from-indigo-950/50 dark:via-background dark:to-purple-950/30 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium mb-6">
            <Camera className="w-4 h-4" />时光回廊
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            光影<span className="text-accent">留存</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            共 {gallery.length} 个瞬间
          </p>
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <GalleryGrid items={gallery} />
      </section>
    </div>
  );
}
