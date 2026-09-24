"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { content } from "@/content";
import { useAccount, useLogout } from "../hooks/use-account";

const t = content.nav.account;

/** Header: "Log in" when signed out, or the customer's first name and "Log out" when signed in. */
export function AccountMenu() {
  const { data: account, isSuccess } = useAccount();
  const logout = useLogout();

  // Nothing until the browser has checked, so a signed-in visitor never sees "Log in" flash by.
  if (!isSuccess) return null;

  return account ? (
    <div className="flex items-center gap-2">
      <span className="max-w-36 truncate text-sm font-medium">{t.hello(account.name.split(" ")[0])}</span>
      <Button variant="outline" size="sm" onClick={() => logout.mutate()}>
        {t.logout}
      </Button>
    </div>
  ) : (
    <Button asChild variant="ghost" size="sm">
      <Link href="/login">{t.login}</Link>
    </Button>
  );
}
