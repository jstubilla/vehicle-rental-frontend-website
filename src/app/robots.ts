import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Keeps private and transactional pages out of search results. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/book", "/api", "/styleguide"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
