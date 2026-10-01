"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui";
import { content } from "@/content";

/**
 * The header's "Book now". Hidden wherever the page itself already leads with that action, so there is
 * one orange call to action per view: the home page (its search starts the booking), a vehicle's page
 * (its own Book now carries the vehicle along) and the booking steps (it would only restart the booking).
 * It comes back on the confirmation page, where booking again is a real next step.
 */
export function BookCta() {
  const pathname = usePathname();
  const pageHasOwn =
    pathname === "/" ||
    pathname.startsWith("/vehicles/") ||
    (pathname.startsWith("/book") && !pathname.startsWith("/book/confirmation"));
  if (pageHasOwn) return null;

  return (
    <Button asChild variant="accent" className="min-h-control-sm px-3 text-sm sm:min-h-control sm:px-4 sm:text-base">
      <Link href={content.nav.bookCta.href}>{content.nav.bookCta.label}</Link>
    </Button>
  );
}
