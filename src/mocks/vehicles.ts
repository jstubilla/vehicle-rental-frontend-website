import type { ImageAsset } from "@/assets/config";
import type { Vehicle } from "@/types";

/**
 * One photo per vehicle type, all in the same style: the vehicle cut out of a Wikimedia Commons photo
 * (credited below, CC BY-SA 4.0), white or black, front corner view with the front to the right, on the
 * same flat light backdrop (#edeef2) with a floor shadow. Each sits in the centre of the frame, so 16:9
 * cards crop only empty backdrop; the narrow row cards show the whole photo on that same colour.
 * Files: public/images/vehicles/<slug>-front.jpg.
 */
const PHOTO_CREDITS: Record<string, { author: string; file: string }> = {
  suv: { author: "Andra Febrian", file: "2021_Toyota_Fortuner_SRZ_2.7_4x2_(Indonesia)_front_view_01.jpg" },
  mpv: { author: "Captainmorlypogi1959", file: "Toyota_Innova_2.8_G_White_Pearl.jpg" },
  sedan: { author: "Zotyefan", file: "Toyota_Vios_IMG001.jpg" },
  hatchback: { author: "Ethan Llamas", file: "Toyota_Wigo_1.0_TRD_S_2022.jpg" },
  van: { author: "Ethan Llamas", file: "Toyota_Hiace_KDH202L_3.0_Commuter_White_-_front.jpg" },
  pickup: { author: "Ethan Llamas", file: "2015_Toyota_Hilux_2.4_E_4x2_in_Super_White_II,_front_right,_06-01-2024.jpg" },
  "125cc": { author: "オーバードライブ83", file: "2018_Honda_Vario_125_CBS_(20211017).jpg" },
  "150cc": { author: "Chanokchon", file: "2025_Yamaha_Aerox_155_ABS.jpg" },
};

function photos(slug: string, name: string): ImageAsset[] {
  const credit = PHOTO_CREDITS[slug];
  return [
    {
      src: credit ? `/images/vehicles/${slug}-front.jpg` : null,
      alt: `${name}, front corner view`,
      label: `${name} photo`,
      ratio: "photo",
      ...(credit && {
        credit: {
          author: credit.author,
          license: "CC BY-SA 4.0",
          href: `https://commons.wikimedia.org/wiki/File:${credit.file}`,
        },
      }),
    },
  ];
}

type Seed = Omit<Vehicle, "images">;

/**
 * One entry per TYPE of vehicle, in the order shown to customers. The example is a guide, not a promise:
 * customers get "this or similar". Daily rates are the ones the earlier example cars had (staff change them
 * on the Pricing screen). Seats are the most the type carries.
 */
const vehicles: Seed[] = [
  { id: "veh-01", slug: "suv", name: "SUV", category: "suv", examples: "Toyota Fortuner or similar", seats: 7, pricePerDay: 4200, status: "available", featured: true },
  { id: "veh-02", slug: "mpv", name: "Multi-purpose vehicle (MPV)", category: "mpv", examples: "Mitsubishi Xpander or similar", seats: 8, pricePerDay: 2600, status: "available", featured: true },
  { id: "veh-03", slug: "sedan", name: "Sedan", category: "sedan", examples: "Toyota Vios or similar", seats: 5, pricePerDay: 1800, status: "available", featured: true },
  { id: "veh-04", slug: "hatchback", name: "Hatchback", category: "hatchback", examples: "Toyota Wigo or similar", seats: 5, pricePerDay: 1400, status: "available", featured: false },
  { id: "veh-05", slug: "van", name: "Van", category: "van", examples: "Toyota HiAce or similar", seats: 15, pricePerDay: 4800, status: "available", featured: true },
  { id: "veh-06", slug: "pickup", name: "Pick-up truck", category: "pickup", examples: "Toyota Hilux or similar", seats: 5, pricePerDay: 3500, status: "available", featured: false },
  { id: "veh-07", slug: "125cc", name: "125cc motorcycle", category: "125cc", examples: "Honda Click 125i or similar", pricePerDay: 450, status: "available", featured: false },
  { id: "veh-08", slug: "150cc", name: "150cc motorcycle", category: "150cc", examples: "Yamaha Aerox 155 or similar", pricePerDay: 600, status: "available", featured: false },
];

export const seedVehicles: Vehicle[] = vehicles.map((v) => ({ ...v, images: photos(v.slug, v.name) }));
