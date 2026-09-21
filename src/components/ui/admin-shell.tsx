"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Button } from "./button";
import { CloseIcon, MenuIcon } from "./icons";

export interface AdminNavItem {
  label: string;
  href: string;
}

export interface AdminShellProps {
  brand: ReactNode;
  nav: readonly AdminNavItem[];
  labels: {
    navigation: string;
    openMenu: string;
    closeMenu: string;
    signedInAs: string;
    logout: string;
    viewSite: string;
  };
  user: { name: string; role: string };
  onLogout: () => void;
  logoutBusy?: boolean;
  siteHref?: string;
  children: ReactNode;
  className?: string;
}

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Admin layout: a sidebar on large screens, a menu button on phones and tablets. */
export function AdminShell({
  brand,
  nav,
  labels,
  user,
  onLogout,
  logoutBusy,
  siteHref = "/",
  children,
  className,
}: AdminShellProps) {
  const pathname = usePathname();
  // Like the public navbar: the menu counts as open only on the page it was opened on.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  const navList = (
    <nav aria-label={labels.navigation}>
      <ul className="flex flex-col gap-1">
        {nav.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className="flex min-h-control items-center rounded-md px-3 font-medium text-foreground no-underline hover:bg-surface-muted aria-[current=page]:bg-secondary aria-[current=page]:font-semibold"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );

  const account = (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <p className="text-sm">
        <span className="block text-muted">{labels.signedInAs}</span>
        <span className="block font-semibold">{user.name}</span>
        <span className="block text-muted">{user.role}</span>
      </p>
      <Button asChild variant="link" size="sm" className="self-start">
        <Link href={siteHref}>{labels.viewSite}</Link>
      </Button>
      <Button variant="outline" size="sm" onClick={onLogout} loading={logoutBusy} className="self-start">
        {labels.logout}
      </Button>
    </div>
  );

  return (
    <div className={cn("min-h-screen bg-surface-muted lg:flex", className)}>
      {/* Desktop sidebar */}
      <aside className="hidden w-sidebar shrink-0 flex-col justify-between gap-6 border-r border-border bg-surface p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:overflow-y-auto">
        <div className="flex flex-col gap-6">
          <div className="px-3 pt-2">{brand}</div>
          {navList}
        </div>
        {account}
      </aside>

      {/* Phone and tablet top bar */}
      <header
        className="border-b border-border bg-surface lg:hidden"
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpenOn(null);
        }}
      >
        <div className="flex min-h-control-lg items-center justify-between gap-4 px-gutter">
          {brand}
          <Button
            variant="outline"
            size="icon"
            aria-expanded={open}
            aria-controls="admin-mobile-menu"
            aria-label={open ? labels.closeMenu : labels.openMenu}
            onClick={() => setOpenOn(open ? null : pathname)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </Button>
        </div>
        {open && (
          <div id="admin-mobile-menu" className="flex flex-col gap-4 border-t border-border px-gutter py-4">
            {navList}
            {account}
          </div>
        )}
      </header>

      <main id="main-content" className="min-w-0 flex-1 px-gutter py-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
