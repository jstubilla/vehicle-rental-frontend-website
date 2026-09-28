import { content } from "@/content";
import { cn } from "@/lib/cn";

/**
 * THE ANIMATION SLOT. Replace this with the company animation and nothing else needs to change.
 * Any animation must respect prefers-reduced-motion: show a still image or a simple fade instead
 * when the visitor has asked for less motion (use Tailwind's motion-safe: / motion-reduce: variants).
 */
function LoadingAnimation() {
  return <p className="text-lg text-muted">{content.loadingScreen.placeholder}</p>;
}

export interface LoadingScreenProps {
  /** Cover the whole window (the screen shown on every refresh) instead of sitting inside the page. */
  fullscreen?: boolean;
  className?: string;
}

/** Placeholder loading screen for the public site: the animation slot plus the "Powered by" credit. */
export function LoadingScreen({ fullscreen = false, className }: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-label={content.loadingScreen.label}
      data-splash={fullscreen ? "" : undefined}
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-gutter py-section text-center",
        fullscreen ? "fixed inset-0 z-(--z-splash) bg-background" : "min-h-[60vh]",
        className,
      )}
    >
      <LoadingAnimation />
      <p className="text-sm text-muted">{content.footer.credit}</p>
    </div>
  );
}
