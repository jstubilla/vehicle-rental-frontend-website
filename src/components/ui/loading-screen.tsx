import { content } from "@/content";
import { cn } from "@/lib/cn";

/**
 * THE ANIMATION SLOT. Currently the company's animated logo, as a matched pair per theme: navy marks
 * for the light background (public/images/loading.gif / loading-static.png) and light marks for the
 * dark background (loading-dark.gif / loading-dark-static.png) — the same navy-on-navy mark would be
 * unreadable in dark mode. To replace it: swap all four files (each an 1:1 recolor of the other) and
 * nothing else needs to change. A plain <img>, not next/image, because next/image would rasterize the
 * GIF and stop it animating. It respects prefers-reduced-motion by showing the still frame instead of
 * the animated one (Tailwind's motion-safe: / motion-reduce: variants; both images are decorative,
 * alt=""). Each theme's pair sits in its own `dark:`-switched block, rather than stacking `dark:` and
 * `motion-safe:` on one element, so the two conditions never have to fight over which one wins.
 *
 * `big` sizes it up further for the full-screen refresh splash, where it's the only thing on screen.
 */
function LoadingAnimation({ big = false }: { big?: boolean }) {
  const size = big ? "w-80 sm:w-[28rem] lg:w-[34rem]" : "w-72 sm:w-96";
  return (
    <>
      <span className="contents dark:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- an animated GIF; next/image cannot animate GIFs */}
        <img src="/images/loading.gif" alt="" width={1440} height={1440} className={cn("hidden motion-safe:block", size)} />
        {/* eslint-disable-next-line @next/next/no-img-element -- the matching still frame; kept as a plain img for the same reason */}
        <img
          src="/images/loading-static.png"
          alt=""
          width={1440}
          height={1440}
          className={cn("motion-safe:hidden", size)}
        />
      </span>
      <span className="hidden dark:contents">
        {/* eslint-disable-next-line @next/next/no-img-element -- an animated GIF; next/image cannot animate GIFs */}
        <img
          src="/images/loading-dark.gif"
          alt=""
          width={600}
          height={600}
          className={cn("hidden motion-safe:block", size)}
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- the matching still frame; kept as a plain img for the same reason */}
        <img
          src="/images/loading-dark-static.png"
          alt=""
          width={1440}
          height={1440}
          className={cn("motion-safe:hidden", size)}
        />
      </span>
    </>
  );
}

export interface LoadingScreenProps {
  /** Cover the whole window (the screen shown on every refresh) instead of sitting inside the page. */
  fullscreen?: boolean;
  /** Fade the screen out. It stops catching clicks at once; the caller removes it once the fade is over. */
  leaving?: boolean;
  className?: string;
}

/** Loading screen for the public site: the animation slot plus the "Powered by" credit. */
export function LoadingScreen({ fullscreen = false, leaving = false, className }: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-label={content.loadingScreen.label}
      data-splash={fullscreen ? "" : undefined}
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-gutter py-section text-center",
        fullscreen ? "fixed inset-0 z-(--z-splash) bg-background" : "min-h-[60vh]",
        "transition-opacity duration-(--duration-modal) ease-out-strong",
        leaving && "pointer-events-none opacity-0",
        className,
      )}
    >
      <LoadingAnimation big={fullscreen} />
      <p className="text-lg font-medium text-muted">{content.footer.credit}</p>
    </div>
  );
}
