import { content } from "@/content";
import { Footer, Logo, SocialLinks } from "@/components/ui";

/** Public footer: wires site content into the Footer from the UI kit. */
export function SiteFooter() {
  return (
    <Footer
      brand={<Logo />}
      description={content.site.description}
      columns={content.footer.columns}
      socials={<SocialLinks links={content.socials} className="flex-col items-start gap-2" />}
      socialsTitle={content.footer.socialsTitle}
      legal={content.footer.legal}
    />
  );
}
