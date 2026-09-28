import type { AnchorHTMLAttributes } from "react";
import { content } from "@/content";
import { cn } from "@/lib/cn";

/** A link inside a sentence that opens in a new tab, so the visitor keeps the page they are on. */
export function NewTabLink({ className, children, ...props }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel">) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={cn("underline underline-offset-4 hover:no-underline", className)}
      {...props}
    >
      {children}
      <span className="sr-only"> ({content.ui.opensInNewTab})</span>
    </a>
  );
}
