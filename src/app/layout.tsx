import type { Metadata } from "next";
import "@/styles/globals.css";
import { fontClassNames } from "@/assets/fonts";
import { content } from "@/content";
import { SkipLink } from "@/components/ui";
import { SITE_URL } from "@/lib/site";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: content.seo.defaultTitle, template: content.seo.titleTemplate },
  description: content.site.description,
  openGraph: {
    type: "website",
    siteName: content.site.name,
    locale: content.seo.locale,
    title: content.seo.defaultTitle,
    description: content.site.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={fontClassNames}>
        <SkipLink />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
