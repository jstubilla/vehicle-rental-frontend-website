import type { Metadata } from "next";
import "@/styles/globals.css";
import { fontClassNames } from "@/assets/fonts";
import { content } from "@/content";
import { SkipLink } from "@/components/ui";
import { SITE_URL } from "@/lib/site";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
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
    <html lang="en" className={fontClassNames} suppressHydrationWarning>
      <head>
        {/* The font variables sit on <html> so tokens.css (--font-heading / --font-body, resolved at :root) can see them. */}
        {/* Sets the saved (or dark, the default) theme before paint, so there is no flash of the wrong one. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <SkipLink />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
