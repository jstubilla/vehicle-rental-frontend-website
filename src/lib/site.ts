/** Public site URL, used for canonical links, sitemap and Open Graph. Set in .env.local. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Shows the "demo controls" (e.g. force a failed payment). Set NEXT_PUBLIC_SHOW_MOCK_CONTROLS=false to hide them. */
export const SHOW_MOCK_CONTROLS = process.env.NEXT_PUBLIC_SHOW_MOCK_CONTROLS !== "false";

/**
 * The "Powered by" loading screen stays up at least this long (milliseconds) on every refresh.
 * public/images/loading.gif reveals its full mark at 1830ms and holds it until 2570ms, so this is
 * set inside that hold; a shorter value would hide the finished animation before anyone sees it.
 * Set to 0 to show the screen only while the page loads.
 */
export const SPLASH_MIN_MS = 2200;
