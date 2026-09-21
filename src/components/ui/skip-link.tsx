import { content } from "@/content";

/** First focusable element on every page: lets keyboard users jump past the header. */
export function SkipLink({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-(--z-toast)"
    >
      {content.nav.skipToContent}
    </a>
  );
}
