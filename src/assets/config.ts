import { content } from "@/content";

/**
 * ALL images and the logo are configured here. To swap a placeholder for a real
 * image: put the file in /public/images and set its `src` (e.g. "/images/hero.jpg").
 * For images hosted elsewhere, also allow the domain in next.config.ts (images.remotePatterns).
 */

export type ImageRatio = "video" | "photo" | "square" | "wide";

export interface ImageAsset {
  /** Path in /public, or null to show the gray placeholder box. */
  src: string | null;
  /** Text alternative for screen readers. */
  alt: string;
  /** Label shown inside the placeholder box. */
  label: string;
  ratio: ImageRatio;
}

export const logo = {
  /** Plain-text wordmark used until a real logo file is provided. */
  wordmark: content.site.name,
  /** Set to an image path (e.g. "/images/logo.svg") to replace the wordmark. */
  src: null as string | null,
  alt: content.site.name,
  width: 160,
  height: 40,
};

export const images = {
  hero: { src: null, alt: "Hero image", label: "Hero image", ratio: "wide" },
  about: { src: null, alt: "About us image", label: "About us image", ratio: "photo" },
  team: { src: null, alt: "Our team", label: "Team photo", ratio: "photo" },
  contact: { src: null, alt: "Map or office photo", label: "Map / office photo", ratio: "photo" },
  vehicle: { src: null, alt: "Vehicle photo", label: "Vehicle photo", ratio: "photo" },
  avatar: { src: null, alt: "Person photo", label: "Photo", ratio: "square" },
} satisfies Record<string, ImageAsset>;

export type ImageKey = keyof typeof images;
