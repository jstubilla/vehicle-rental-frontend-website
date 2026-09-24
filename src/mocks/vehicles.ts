import type { ImageAsset } from "@/assets/config";
import type { Vehicle } from "@/types";

/** Four placeholder photos per vehicle (front, side, three-quarter, rear). */
function photos(name: string): ImageAsset[] {
  return ["Front view", "Side view", "Three-quarter view", "Rear view"].map((view) => ({
    src: null,
    alt: `${name}, ${view.toLowerCase()}`,
    label: `${name} photo: ${view}`,
    ratio: "photo",
  }));
}

type Seed = Omit<Vehicle, "images">;

const vehicles: Seed[] = [
  { id: "veh-01", slug: "toyota-wigo-2024", name: "Toyota Wigo", category: "sedan", seats: 5, pricePerDay: 1400, plateNumber: "NCA 1024", status: "available", featured: false },
  { id: "veh-02", slug: "mitsubishi-mirage-g4-2023", name: "Mitsubishi Mirage G4", category: "sedan", seats: 5, pricePerDay: 1500, plateNumber: "NDB 2231", status: "available", featured: false },
  { id: "veh-03", slug: "toyota-vios-2024", name: "Toyota Vios", category: "sedan", seats: 5, pricePerDay: 1800, plateNumber: "NEA 4410", status: "available", featured: true },
  { id: "veh-04", slug: "honda-city-2024", name: "Honda City", category: "sedan", seats: 5, pricePerDay: 2100, plateNumber: "NFC 8830", status: "available", featured: false },
  { id: "veh-05", slug: "mitsubishi-xpander-2024", name: "Mitsubishi Xpander", category: "van", seats: 7, pricePerDay: 2600, plateNumber: "NGD 5512", status: "available", featured: true },
  { id: "veh-06", slug: "toyota-innova-2023", name: "Toyota Innova", category: "van", seats: 7, pricePerDay: 2800, plateNumber: "NHE 3308", status: "maintenance", featured: false },
  { id: "veh-07", slug: "toyota-corolla-cross-hybrid-2024", name: "Toyota Corolla Cross Hybrid", category: "suv", seats: 5, pricePerDay: 3600, plateNumber: "NJF 7745", status: "available", featured: false },
  { id: "veh-08", slug: "byd-atto-3-2024", name: "BYD Atto 3", category: "suv", seats: 5, pricePerDay: 4000, plateNumber: "NKG 9021", status: "available", featured: false },
  { id: "veh-09", slug: "toyota-fortuner-2024", name: "Toyota Fortuner", category: "suv", seats: 7, pricePerDay: 4200, plateNumber: "NLH 1187", status: "available", featured: true },
  { id: "veh-10", slug: "toyota-hilux-2023", name: "Toyota Hilux", category: "suv", seats: 5, pricePerDay: 3500, plateNumber: "NMJ 6650", status: "available", featured: false },
  { id: "veh-11", slug: "nissan-urvan-2022", name: "Nissan Urvan", category: "van", seats: 15, pricePerDay: 3200, plateNumber: "NNK 2249", status: "available", featured: false },
  { id: "veh-12", slug: "toyota-hiace-grandia-2024", name: "Toyota HiAce Grandia", category: "van", seats: 12, pricePerDay: 4800, plateNumber: "NPL 8873", status: "available", featured: true },
  { id: "veh-13", slug: "honda-click-125i-2024", name: "Honda Click 125i", category: "125cc", pricePerDay: 450, plateNumber: "MC 1102", status: "available", featured: false },
  { id: "veh-14", slug: "yamaha-aerox-155-2023", name: "Yamaha Aerox 155", category: "155cc", pricePerDay: 600, plateNumber: "MC 2245", status: "available", featured: false },
];

export const seedVehicles: Vehicle[] = vehicles.map((v) => ({ ...v, images: photos(v.name) }));
