import Image from "next/image";
import { cn } from "@/lib/cn";
import { images, type ImageAsset, type ImageKey, type ImageRatio } from "@/assets/config";

const ratios: Record<ImageRatio, string> = {
  video: "aspect-video",
  photo: "aspect-photo",
  square: "aspect-square",
  wide: "aspect-wide",
};

export interface MediaProps {
  /** A key from assets/config.ts, or a full asset object (e.g. from a vehicle record). */
  asset: ImageKey | ImageAsset;
  className?: string;
  /** Set true for images at the top of the page (loads them sooner). */
  priority?: boolean;
  /** Tells the browser how wide the image is at each screen size. */
  sizes?: string;
}

/**
 * Shows a real image (via next/image) when the asset has a `src`, otherwise a
 * gray labeled placeholder box. Swapping assets never touches the calling code.
 */
export function Media({ asset, className, priority, sizes = "100vw" }: MediaProps) {
  const resolved = typeof asset === "string" ? images[asset] : asset;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-border bg-placeholder text-placeholder-foreground",
        ratios[resolved.ratio],
        className,
      )}
    >
      {resolved.src ? (
        <Image
          src={resolved.src}
          alt={resolved.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={resolved.alt}
          className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm font-medium"
        >
          {resolved.label}
        </div>
      )}
    </div>
  );
}
