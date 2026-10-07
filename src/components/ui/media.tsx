import Image from "next/image";
import { cn } from "@/lib/cn";
import { images, type ImageAsset, type ImageKey, type ImageRatio } from "@/assets/config";
import { ImageIcon } from "./icons";

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
  /** Ease the picture in a little while a surrounding `group` is hovered. */
  zoom?: boolean;
  /** "contain" shows the whole picture when the frame's shape differs from the photo's (set a matching background). */
  fit?: "cover" | "contain";
}

/**
 * Shows a real image (via next/image) when the asset has a `src`, otherwise a designed empty slot
 * (fine hatching, a frame icon and the slot's label). Swapping assets never touches the calling code.
 * `zoom`: the picture eases in slightly while a surrounding `group` (e.g. a vehicle card) is hovered.
 */
export function Media({ asset, className, priority, sizes = "100vw", zoom = false, fit = "cover" }: MediaProps) {
  const resolved = typeof asset === "string" ? images[asset] : asset;
  const layer = cn(
    zoom &&
      "transition-transform duration-(--duration-slow) ease-out-strong motion-safe:group-hover:scale-[1.04]",
  );

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-border bg-placeholder text-placeholder-foreground",
        // A hairline inside the edge, so a photo's own edge never bleeds into the page.
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:ring-1 after:ring-foreground/5 after:ring-inset",
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
          className={cn(fit === "contain" ? "object-contain" : "object-cover", layer)}
        />
      ) : (
        <div
          role="img"
          aria-label={resolved.alt}
          className={cn("media-slot absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center", layer)}
        >
          <ImageIcon aria-hidden="true" className="size-6 opacity-70" />
          <span className="max-w-[24ch] text-xs font-medium">{resolved.label}</span>
        </div>
      )}
    </div>
  );
}
