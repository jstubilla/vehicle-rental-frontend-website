"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { content } from "@/content";
import { Button } from "./button";
import { CloseIcon, MenuIcon } from "./icons";
import { Container } from "./layout";

export interface NavbarLink {
  label: string;
  href: string;
}

export type NavbarVariant = "default" | "inverted";

const variants: Record<NavbarVariant, string> = {
  default: "border-b border-border bg-surface text-foreground",
  inverted: "bg-primary text-primary-foreground",
};

export interface NavbarProps {
  brand: ReactNode;
  links: readonly NavbarLink[];
  /** Buttons on the right (e.g. "Book now"). */
  actions?: ReactNode;
  /** Thin strip above the main row (e.g. phone number and social links). Hidden on phones. */
  utility?: ReactNode;
  variant?: NavbarVariant;
  className?: string;
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Public site header. Collapses into a menu button on phones. */
export function Navbar({ brand, links, actions, utility, variant = "default", className }: NavbarProps) {
  const pathname = usePathname();
  // The menu is "open" only for the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  return (
    <header
      className={cn("sticky top-0 z-(--z-nav)", variants[variant], className)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpenOn(null);
      }}
    >
      {utility && (
        <div className="hidden border-b border-border md:block">
          <Container className="flex min-h-control-sm items-center justify-between text-sm">
            {utility}
          </Container>
        </div>
      )}
      <Container className="flex min-h-control-lg items-center justify-between gap-4">
        {brand}

        <nav aria-label={content.nav.primaryLabel} className="hidden md:block">
          <ul className="flex items-center gap-6">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(pathname, link.href) ? "page" : undefined}
                  className="text-base font-medium text-inherit no-underline hover:underline aria-[current=page]:underline aria-[current=page]:underline-offset-8"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {actions && <div className="hidden md:block">{actions}</div>}
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? content.ui.closeMenu : content.ui.openMenu}
            onClick={() => setOpenOn(open ? null : pathname)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </Button>
        </div>
      </Container>

      {open && (
        <div id="mobile-menu" className="border-t border-border md:hidden">
          <Container className="flex flex-col gap-2 py-4">
            <nav aria-label={content.nav.primaryLabel}>
              <ul className="flex flex-col">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={isActive(pathname, link.href) ? "page" : undefined}
                      className="flex min-h-control items-center text-base font-medium text-inherit no-underline aria-[current=page]:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            {actions && <div className="pt-2">{actions}</div>}
          </Container>
        </div>
      )}
    </header>
  );
}
