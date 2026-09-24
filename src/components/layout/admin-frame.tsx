"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminShell, Logo, Skeleton } from "@/components/ui";
import { content } from "@/content";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { ADMIN_NAV } from "@/features/admin/nav";

const t = content.admin;

/**
 * Frame around every signed-in admin page. proxy.ts already blocks visitors who are
 * not signed in; this also handles a session that runs out while the page is open.
 */
export function AdminFrame({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, isLoading, can } = useAuth();
  const { logout, isLoggingOut } = useLogout();

  useEffect(() => {
    if (!isLoading && !session) router.replace("/admin/login");
  }, [isLoading, session, router]);

  if (!session) {
    return (
      <main id="main-content" className="flex flex-col gap-4 p-gutter" role="status" aria-label={t.frame.loading}>
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40" />
      </main>
    );
  }

  const nav = ADMIN_NAV.filter((item) => item.permission === null || can(item.permission));

  return (
    <AdminShell
      brand={
        <>
          <Logo href="/admin" />
          <span className="sr-only">{t.frame.brand}</span>
        </>
      }
      nav={nav}
      labels={{
        navigation: t.nav.label,
        openMenu: t.frame.openMenu,
        closeMenu: t.frame.closeMenu,
        signedInAs: t.frame.signedInAs,
        logout: isLoggingOut ? t.frame.loggingOut : t.frame.logout,
        viewSite: t.nav.viewSite,
      }}
      user={{ name: session.name, role: session.roleName }}
      onLogout={logout}
      logoutBusy={isLoggingOut}
    >
      {children}
    </AdminShell>
  );
}
