import type { ImageAsset } from "@/assets/config";
import type { Vehicle } from "@/types";

/** Four placeholder photos per vehicle type (front, side, three-quarter, rear). */
function photos(name: string): ImageAsset[] {
  return ["Front view", "Side view", "Three-quarter view", "Rear view"].map((view) => ({
    src: null,
    alt: `${name}, ${view.toLowerCase()}`,
    label: `${name} photo: ${view}`,
    ratio: "photo",
  }));
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
  { id: "veh-08", slug: "155cc", name: "155cc motorcycle", category: "155cc", examples: "Yamaha Aerox 155 or similar", pricePerDay: 600, status: "available", featured: false },
];

export const seedVehicles: Vehicle[] = vehicles.map((v) => ({ ...v, images: photos(v.name) }));
