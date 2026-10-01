import type { AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { content } from "@/content";
import { cn } from "@/lib/cn";
import { ChevronRightIcon } from "./icons";

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

/**
 * A standalone link to another page, such as "View all vehicles": a text link with a small arrow,
 * used instead of an outline button when the action is navigation, not a commitment.
 */
export function ArrowLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-h-control-sm items-center gap-1 font-semibold text-link no-underline underline-offset-4 hover:underline",
        className,
      )}
    >
      {children}
      <ChevronRightIcon
        aria-hidden="true"
        className="size-4 transition-transform duration-(--duration-fast) ease-out group-hover:translate-x-0.5"
      />
    </Link>
  );
}
