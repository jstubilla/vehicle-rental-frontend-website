"use client";

import { useState } from "react";
import type { ImageAsset } from "@/assets/config";
import { Media } from "@/components/ui";
import { content } from "@/content";
import { cn } from "@/lib/cn";

/** One large photo plus clickable thumbnails. */
export function VehicleGallery({ images }: { images: ImageAsset[] }) {
  const [selected, setSelected] = useState(0);
  const current = images[selected] ?? images[0];
  if (!current) return null;

  return (
    <div className="flex flex-col gap-3" role="group" aria-label={content.vehicleDetail.galleryLabel}>
      <Media
        key={selected}
        asset={current}
        priority
        sizes="(min-width: 64rem) 58vw, 100vw"
        className="aspect-video transition-opacity duration-(--duration-fast) ease-out starting:opacity-0"
      />
      {current.credit && (
        <p className="text-xs text-muted">
          <a href={current.credit.href} target="_blank" rel="noopener noreferrer" className="text-muted">
            {content.vehicleDetail.photoCredit(current.credit.author, current.credit.license)}
          </a>
        </p>
      )}
      {images.length > 1 && (
        <ul className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <li key={image.label}>
              <button
                type="button"
                aria-label={content.vehicleDetail.viewPhoto(index + 1)}
                aria-pressed={index === selected}
                onClick={() => setSelected(index)}
                className={cn(
                  "block w-full overflow-hidden rounded-lg border-2 border-transparent transition-colors duration-(--duration-fast)",
                  index === selected ? "border-primary" : "hover:border-border-strong",
                )}
              >
                <Media asset={{ ...image, label: `${index + 1}` }} sizes="20vw" className="aspect-video rounded-md border-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
