import Image from "next/image";
import { images, type ImageAsset, type ImageKey } from "@/assets/config";
import { cn } from "@/lib/cn";

/**
 * A decorative photo behind a page's opening section. It starts under the header (which is clear at the
 * top of the page) and fades into the page; the washes and the scroll fade live in globals.css under
 * .hero-backdrop. Place it as the first child of a `relative` section (it sits at -z-10, behind the
 * page's content but above the page background); pass a bottom inset when
 * something overlaps the section's foot, so the fade ends where the next surface begins. Renders nothing while
 * the asset has no `src`, so the section simply sits on the page background.
 */
export function HeroBackdrop({ asset, className }: { asset: ImageKey | ImageAsset; className?: string }) {
  const resolved = typeof asset === "string" ? images[asset] : asset;
  if (!resolved.src) return null;

  return (
    <div aria-hidden="true" className={cn("hero-backdrop pointer-events-none absolute inset-x-0 bottom-0 -z-10 overflow-hidden", className)}>
      {/* The frame reaches above the backdrop so the photo can be set higher than object-position alone allows. */}
      <div className="hero-backdrop-frame absolute inset-x-0 bottom-0">
        <Image src={resolved.src} alt="" fill priority sizes="100vw" className="object-cover" />
      </div>
    </div>
  );
}
