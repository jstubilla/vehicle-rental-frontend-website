import Link from "next/link";
import { content } from "@/content";
import { Button, Logo, Navbar, SocialLinks } from "@/components/ui";

/** Public header: wires site content into the Navbar from the UI kit. */
export function SiteHeader() {
  return (
    <Navbar
      brand={<Logo />}
      links={content.nav.public}
      utility={
        <>
          <span>{content.site.contactPhone}</span>
          <SocialLinks links={content.socials} />
        </>
      }
      actions={
        <Button asChild variant="accent">
          <Link href={content.nav.bookCta.href}>{content.nav.bookCta.label}</Link>
        </Button>
      }
    />
  );
}
