/** Public site URL, used for canonical links, sitemap and Open Graph. Set in .env.local. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Shows the "demo controls" (e.g. force a failed payment). Set NEXT_PUBLIC_SHOW_MOCK_CONTROLS=false to hide them. */
export const SHOW_MOCK_CONTROLS = process.env.NEXT_PUBLIC_SHOW_MOCK_CONTROLS !== "false";
