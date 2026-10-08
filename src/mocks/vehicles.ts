import type { ImageAsset } from "@/assets/config";
import type { Vehicle } from "@/types";

/**
 * One photo per vehicle type, all in the same style: the vehicle cut out of a Wikimedia Commons photo
 * (credited below, CC BY-SA 4.0 unless noted), white or black, front corner view from the side with the
 * front to the right, on the same flat light backdrop (#edeef2) with a floor shadow. Each sits in the centre
 * of the frame, so 16:9 cards crop only empty backdrop; the narrow row cards show the whole photo on that
 * same colour.
 * Files: public/images/vehicles/<slug>-front.jpg.
 */
const PHOTO_CREDITS: Record<string, { author: string; file: string; license?: string }> = {
  suv: { author: "Ethan Llamas", file: "Toyota_Fortuner_2.8_Q_2022.jpg" },
  mpv: { author: "Ethan Llamas", file: "Toyota_Innova_GUN143_FL_2.8_XE_Black.jpg" },
  sedan: { author: "Zotyefan", file: "Toyota_Vios_IMG001.jpg" },
  hatchback: { author: "Ethan Llamas", file: "Toyota_Wigo_1.0_TRD_S_2022.jpg" },
  van: { author: "Wide Awake!", file: "2024_Toyota_Hiace_GL_Grandia_in_P._Burgos_Street_(2025-04-18).jpg", license: "CC BY 4.0" },
  pickup: { author: "Ethan Llamas", file: "Toyota_Hilux_GUN135_FL2_2.4_G_4x2_Prerunner_Attitude_Black_Mica_01.jpg" },
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
          license: credit.license ?? "CC BY-SA 4.0",
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
  { id: "veh-01", slug: "suv", name: "SUV", category: "suv", examples: "Toyota Fortuner, Mitsubishi Montero, Ford Everest, Nissan Terra or similar", seats: 7, pricePerDay: 4000, status: "available", featured: true },
  { id: "veh-02", slug: "mpv", name: "Multi-purpose vehicle (MPV)", category: "mpv", examples: "Toyota Avanza, Mitsubishi Xpander, Hyundai Stargazer, Toyota Innova or similar", seats: 8, pricePerDay: 2600, status: "available", featured: true },
  { id: "veh-03", slug: "sedan", name: "Sedan", category: "sedan", examples: "Toyota Vios, Mitsubishi Mirage, Suzuki Dzire, Toyota Ativ or similar", seats: 5, pricePerDay: 1800, status: "available", featured: true },
  { id: "veh-04", slug: "hatchback", name: "Hatchback", category: "hatchback", examples: "Toyota Wigo or similar", seats: 5, pricePerDay: 1600, status: "available", featured: false },
  { id: "veh-05", slug: "van", name: "Van", category: "van", examples: "Toyota Commuter, Toyota HiAce, Toyota Grandia, Nissan NV350 or similar", seats: 15, pricePerDay: 4500, status: "available", featured: true },
  { id: "veh-06", slug: "pickup", name: "Pick-up truck", category: "pickup", examples: "Toyota Hilux or similar", seats: 5, pricePerDay: 3500, status: "available", featured: false },
  { id: "veh-07", slug: "125cc", name: "Motorcycle (125cc and below)", category: "125cc", examples: "Honda Click 125i or similar", pricePerDay: 550, status: "available", featured: false },
  { id: "veh-08", slug: "150cc", name: "Motorcycle (150cc–160cc)", category: "150cc", examples: "Yamaha Aerox 155 or similar", pricePerDay: 700, status: "available", featured: false },
];

export const seedVehicles: Vehicle[] = vehicles.map((v) => ({ ...v, images: photos(v.slug, v.name) }));
