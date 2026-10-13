"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { content } from "@/content";
import { Button } from "./button";
import { CloseIcon, MenuIcon } from "./icons";
import { Container } from "./layout";
import { ThemeToggle } from "./theme-toggle";

export interface NavbarLink {
  label: string;
  href: string;
}

export type NavbarVariant = "default" | "inverted";

const variants: Record<NavbarVariant, string> = {
  // Clear at the top (the page, or the home backdrop, shows through), then translucent over the page once
  // it scrolls, so content passing beneath reads as depth, not a hard cut.
  default:
    "border-b border-transparent bg-transparent text-foreground transition-[background-color,border-color,box-shadow] duration-(--duration-base) ease-out data-[scrolled=true]:border-border data-[scrolled=true]:bg-surface/85 data-[scrolled=true]:shadow-md data-[scrolled=true]:backdrop-blur-md",
  inverted: "bg-primary text-primary-foreground",
};

export interface NavbarProps {
  brand: ReactNode;
  links: readonly NavbarLink[];
  /** Secondary items on the right (e.g. the account menu). Moves into the menu panel on phones. */
  actions?: ReactNode;
  /** The main call to action (e.g. "Book now"). Stays visible on every screen size, beside the menu button on phones. */
  primaryAction?: ReactNode;
  /** Thin strip above the main row (e.g. phone number and social links). Hidden on phones. */
  utility?: ReactNode;
  variant?: NavbarVariant;
  className?: string;
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Public site header. Collapses into a menu button on phones. */
export function Navbar({ brand, links, actions, primaryAction, utility, variant = "default", className }: NavbarProps) {
  const pathname = usePathname();
  // The menu is "open" only for the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  // Keeps the panel's content in the DOM for the close transition, then removes it (matching the
  // original behavior of not duplicating nav/account content in the tree while collapsed).
  const [mounted, setMounted] = useState(false);
  // Whether the page has scrolled under the header (it gains a surface, rule and shadow).
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      data-scrolled={scrolled || open}
      className={cn("sticky top-0 z-(--z-nav)", variants[variant], className)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpenOn(null);
      }}
    >
      {utility && (
        <div className="hidden border-b border-border lg:block">
          <Container className="flex min-h-control-sm items-center justify-between text-sm">
            {utility}
          </Container>
        </div>
      )}
      <Container className="flex min-h-control-lg items-center justify-between gap-4">
        {brand}

        <nav aria-label={content.nav.primaryLabel} className="hidden lg:block">
          <ul className="flex items-center gap-6">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(pathname, link.href) ? "page" : undefined}
                  className="relative py-2 text-sm font-medium text-muted no-underline transition-colors duration-(--duration-fast) after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-(--duration-modal) after:ease-out-strong hover:text-foreground hover:after:scale-x-100 aria-[current=page]:text-foreground aria-[current=page]:after:scale-x-100"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {actions && <div className="hidden lg:block">{actions}</div>}
          {primaryAction}
          <ThemeToggle />
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? content.ui.closeMenu : content.ui.openMenu}
            onClick={() => {
              if (!open) setMounted(true);
              setOpenOn(open ? null : pathname);
            }}
          >
            {/* The two icons trade places with a quarter turn rather than swapping in a single frame. */}
            <span className="relative size-4">
              <MenuIcon
                className={cn(
                  "absolute inset-0 transition-[opacity,rotate,scale] duration-(--duration-base) ease-out-strong",
                  open && "rotate-90 scale-75 opacity-0",
                )}
              />
              <CloseIcon
                className={cn(
                  "absolute inset-0 transition-[opacity,rotate,scale] duration-(--duration-base) ease-out-strong",
                  !open && "-rotate-90 scale-75 opacity-0",
                )}
              />
            </span>
          </Button>
        </div>
      </Container>

      <div
        id="mobile-menu"
        inert={!open}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && !open) setMounted(false);
        }}
        className={cn(
          "grid transition-[grid-template-rows] duration-(--duration-base) ease-out-strong lg:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div
          className={cn(
            "overflow-hidden border-t border-border transition-opacity duration-(--duration-base) ease-out-strong",
            !open && "opacity-0",
          )}
        >
          {mounted && (
            <Container className="flex flex-col gap-2 py-4">
              <nav aria-label={content.nav.primaryLabel}>
                <ul className="flex flex-col">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={isActive(pathname, link.href) ? "page" : undefined}
                        className="flex min-h-control items-center text-base font-medium text-inherit no-underline decoration-2 underline-offset-8 aria-[current=page]:underline aria-[current=page]:decoration-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              {/* Account actions, set apart from the page links and aligned to their left edge. */}
              {actions && <div className="border-t border-border pt-3 [&_a]:px-0">{actions}</div>}
            </Container>
          )}
        </div>
      </div>
    </header>
  );
}
