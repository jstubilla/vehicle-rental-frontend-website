import { Inter, Plus_Jakarta_Sans } from "next/font/google";

/**
 * Fonts. Self-hosted via next/font (no runtime request to Google, no layout shift).
 * Plus Jakarta Sans carries headings; Inter carries body text, labels, buttons and
 * data. Both feed tokens.css (--font-heading / --font-body) as CSS variables, so the
 * rest of the app never imports a font directly.
 */
const headingFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-designer-heading",
  display: "swap",
});

const bodyFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-designer-body",
  display: "swap",
});

export const fontClassNames = `${headingFont.variable} ${bodyFont.variable}`;
