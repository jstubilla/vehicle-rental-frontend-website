import { content } from "@/content";
import { Logo, Navbar } from "@/components/ui";
import { AccountMenu } from "@/features/account/components/account-menu";
import { BookCta } from "./book-cta";

/** Public header: wires site content into the Navbar from the UI kit. */
export function SiteHeader() {
  return (
    <Navbar brand={<Logo />} links={content.nav.public} actions={<AccountMenu />} primaryAction={<BookCta />} />
  );
}
