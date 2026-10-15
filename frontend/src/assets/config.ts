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

/** The Creative Commons deed for a licence name like "CC BY-SA 4.0", which the licence asks credits to link to. */
export function licenseHref(license: string): string | undefined {
  const match = /^CC (BY(?:-SA)?) (\d\.\d)$/.exec(license);
  return match ? `https://creativecommons.org/licenses/${match[1].toLowerCase()}/${match[2]}/` : undefined;
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
  // Licence checked 2026-10-15: served from images.unsplash.com, so it is under the free Unsplash License (business
  // use allowed, no credit required); Unsplash+ photos are served from plus.unsplash.com instead.
  // TEST ONLY: a free Unsplash photo (Unsplash License) of the Patapat Viaduct, Ilocos Norte, to judge the
  // home backdrop with a real image. Replace with your own ("/images/backdrop.jpg") and drop
  // images.remotePatterns in next.config.ts. Set src to null to show no backdrop at all.
  backdrop: {
    src: "https://images.unsplash.com/photo-1545876966-1dec0948ec2c",
    alt: "",
    label: "Home backdrop",
    ratio: "wide",
  },
  /** Tours & Transfers page backdrop: Islas de Gigantes, Carles, Iloilo (Wikimedia Commons). */
  toursBackdrop: {
    src: "/images/tours/gigantes-wide.jpg",
    alt: "",
    label: "Tours & Transfers backdrop",
    ratio: "wide",
    credit: {
      author: "Patrick Poculan",
      license: "CC BY 2.0",
      href: "https://commons.wikimedia.org/wiki/File:Gigantes_Island.jpg",
    },
  },
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

/**
 * Tours & Transfers photos, one per route or tour, keyed by the item's name in content.specialOffers.priceLists
 * (a transfer shows where it ends up). All from Wikimedia Commons under licences that allow business use with
 * credit; the page lists the credits. Resized copies live in /public/images/tours.
 */
const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${file}`;

export const tourPhotos: Record<string, ImageAsset> = {
  "Airport to Hotel (City Area)": {
    src: "/images/tours/airport.jpg",
    alt: "Control tower and taxiway at Iloilo International Airport",
    label: "Iloilo International Airport",
    ratio: "photo",
    credit: { author: "Ralff Nestor Nacor", license: "CC BY-SA 4.0", href: commons("Iloilo_International_Airport,_Aug_2024_(2).jpg") },
  },
  "Iloilo City to Caticlan": {
    src: "/images/tours/caticlan.jpg",
    alt: "Boats in the bay seen from the Caticlan jetty port",
    label: "Caticlan",
    ratio: "photo",
    credit: { author: "Tuderna", license: "CC BY 3.0", href: commons("View_from_Caticlan's_jetty_port_-_panoramio.jpg") },
  },
  "Caticlan to Iloilo City": {
    src: "/images/tours/iloilo-city.jpg",
    alt: "Iloilo City skyline across the water from Fort San Pedro",
    label: "Iloilo City",
    ratio: "photo",
    credit: {
      author: "Patrickroque01",
      license: "CC BY-SA 4.0",
      href: commons("Iloilo_City_proper_skyline,_Fort_San_pedro_(Iloilo_city;_01-27-2023).jpg"),
    },
  },
  "Iloilo City to Concepcion": {
    src: "/images/tours/concepcion.jpg",
    alt: "A white sandbar running out to an island off Concepcion",
    label: "Concepcion",
    ratio: "photo",
    credit: {
      author: "Mhlayson",
      license: "CC BY-SA 4.0",
      href: commons("Dji_fly_20250802_154532_750_1754120929023_photo_optimized.jpg"),
    },
  },
  "City Tour": {
    src: "/images/tours/city-tour.jpg",
    alt: "Molo Church and its plaza in Iloilo City",
    label: "Molo Church",
    ratio: "photo",
    credit: { author: "Renz0903", license: "CC BY 4.0", href: commons("Molo_Church_and_Molo_Plaza_with_Fountain.jpg") },
  },
  "City Tour + Garin Farm": {
    src: "/images/tours/garin-farm.jpg",
    alt: "San Joaquin and the sea seen from Garin Farm",
    label: "Garin Farm, San Joaquin",
    ratio: "photo",
    credit: { author: "A.C.T. Alejandre", license: "CC BY-SA 4.0", href: commons("San_Joaquin_town_center.jpg") },
  },
  "Guimaras Tour": {
    src: "/images/tours/guimaras.jpg",
    alt: "Natago Beach on Guimaras island",
    label: "Natago Beach, Guimaras",
    ratio: "photo",
    credit: { author: "Tony Castley", license: "CC BY 2.0", href: commons("Natago_Beach,_Guimaras.jpg") },
  },
  "Gigantes Day Tour": {
    src: "/images/tours/gigantes.jpg",
    alt: "Rock formations and palm trees on a beach in Islas de Gigantes",
    label: "Islas de Gigantes",
    ratio: "photo",
    credit: { author: "Mhlayson", license: "CC BY-SA 4.0", href: commons("Islas_de_Gigantes_3.jpg") },
  },
};

/**
 * About page team photos, in the same order as content.about.team.members. Each is the person's own
 * outdoor photo, cropped to the same head-and-shoulders square with the eyes at the same height.
 * A missing entry falls back to the plain `team` placeholder.
 */
const TEAM_PHOTO_FILES = ["/images/team/peter.jpg", "/images/team/erika.jpg", "/images/team/cynde.jpg"];

export const teamPhotos: ImageAsset[] = content.about.team.members.map((member, index) => ({
  src: TEAM_PHOTO_FILES[index] ?? null,
  alt: `${member.name}, ${member.role}`,
  label: member.name,
  ratio: "square",
}));
