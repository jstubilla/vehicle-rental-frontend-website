import Link from "next/link";
import { content } from "@/content";
import { Button, Logo, Navbar } from "@/components/ui";
import { AccountMenu } from "@/features/account/components/account-menu";

/** Public header: wires site content into the Navbar from the UI kit. */
export function SiteHeader() {
  return (
    <Navbar
      brand={<Logo />}
      links={content.nav.public}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <AccountMenu />
          <Button asChild variant="accent">
            <Link href={content.nav.bookCta.href}>{content.nav.bookCta.label}</Link>
          </Button>
        </div>
      }
    />
  );
}
