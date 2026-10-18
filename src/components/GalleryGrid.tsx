'use client';

import type { GalleryItem } from '@/lib/gallery';

export default function GalleryGrid({ items }: { items: GalleryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/50 rounded-xl border border-border">
        <p className="text-muted-foreground">暂无图片，敬请期待！</p>
      </div>
    );
  }

  return (
    <div className="masonry">
      {items.map((item, index) => (
        <div key={index} className="masonry-item">
          <div className="group rounded-lg overflow-hidden border border-border hover:shadow-[0_0_12px_var(--glow)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
            onClick={() => {
              const event = new CustomEvent('open-lightbox', { detail: { url: item.url } });
              window.dispatchEvent(event);
            }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.title}
              className="w-full object-cover"
              loading="lazy"
            />
            <div className="p-3">
              <p className="text-sm font-medium text-accent truncate">{item.title}</p>
              {item.date && (
                <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
