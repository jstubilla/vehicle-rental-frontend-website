import { content } from "@/content";

/**
 * ALL images and the logo are configured here. To swap a placeholder for a real
 * image: put the file in /public/images and set its `src` (e.g. "/images/about.jpg").
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
  /** Who took the photo, for photos used under a licence that requires credit (shown beside the photo). */
  credit?: { author: string; license: string; href: string };
}

export const logo = {
  /** Plain-text wordmark used until a real logo file is provided. */
  wordmark: content.site.name,
  /** Set to an image path (e.g. "/images/logo.svg") to replace the wordmark. */
  src: "/images/logo.png" as string | null,
  /** Optional second file used only in dark mode. Leave null to use `src` in both themes. */
  srcDark: "/images/logo-dark.png" as string | null,
  alt: "Ela's Car Rental",
  /** The light file's own size (sets the shape). The logo is shown at a fixed height, see Logo. */
  width: 480,
  height: 165,
  /** The dark file's own size. */
  darkWidth: 480,
  darkHeight: 169,
};

export const images = {
  // TEST ONLY: a free Unsplash photo (Unsplash License) of the Patapat Viaduct, Ilocos Norte, to judge the
  // home backdrop with a real image. Replace with your own ("/images/backdrop.jpg") and drop
  // images.remotePatterns in next.config.ts. Set src to null to show no backdrop at all.
  backdrop: {
    src: "https://images.unsplash.com/photo-1545876966-1dec0948ec2c",
    alt: "",
    label: "Home backdrop",
    ratio: "wide",
  },
  about: { src: null, alt: "About us image", label: "About us image", ratio: "photo" },
  team: { src: null, alt: "Our team", label: "Team photo", ratio: "square" },
  contact: { src: null, alt: "Map or office photo", label: "Map / office photo", ratio: "video" },
  vehicle: { src: null, alt: "Vehicle photo", label: "Vehicle photo", ratio: "photo" },
  avatar: { src: null, alt: "Person photo", label: "Photo", ratio: "square" },
} satisfies Record<string, ImageAsset>;

export type ImageKey = keyof typeof images;

/**
 * Home page renter photos, in display order (the reviews carousel), each one with its van. Each is cropped
 * from a "Thank you renters" post with the overlays removed, so they are only sharp enough for small sizes.
 */
export const renterPhotos: ImageAsset[] = [
  { src: "/images/renters/family-silver-van.jpg", alt: "A family in sun hats beside a silver van on a city street" },
  { src: "/images/renters/family-van-door.jpg", alt: "A large family with children in front of a white van with its door open" },
  { src: "/images/renters/friends-hiace.jpg", alt: "Five friends posing around the front of a white Toyota Hiace" },
  { src: "/images/renters/students-campus.jpg", alt: "A group of students with their van on a university campus" },
].map((photo) => ({ ...photo, label: photo.alt, ratio: "wide" as const }));
