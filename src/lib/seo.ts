import type { Metadata } from "next";
import { content } from "@/content";

interface PageMeta {
  title: string;
  description: string;
  /** Path starting with "/", used for the canonical link and Open Graph URL. */
  path: string;
}

/** One place to build a page's title, description, canonical link and Open Graph tags. */
export function buildMetadata({ title, description, path }: PageMeta): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: content.site.name,
      locale: content.seo.locale,
      title: `${title} | ${content.site.name}`,
      description,
      url: path,
    },
  };
}
