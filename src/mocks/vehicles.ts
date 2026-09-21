import type { ImageAsset } from "@/assets/config";
import type { Vehicle } from "@/types";

/** Four placeholder photos per vehicle (front, side, interior, rear). */
function photos(name: string): ImageAsset[] {
  return ["Front view", "Side view", "Interior", "Rear view"].map((view) => ({
    src: null,
    alt: `${name}, ${view.toLowerCase()}`,
    label: `${name} photo: ${view}`,
    ratio: "photo",
  }));
}

type Seed = Omit<Vehicle, "images">;

const vehicles: Seed[] = [
  {
    id: "veh-01", slug: "toyota-wigo-2024", name: "Toyota Wigo", make: "Toyota", model: "Wigo", year: 2024,
    category: "hatchback", transmission: "manual", fuel: "gasoline", seats: 5, pricePerDay: 1400,
    description: "A compact and fuel-efficient city car. Easy to park and cheap to run.",
    features: ["Air conditioning", "Bluetooth audio", "USB charging", "Dual airbags"],
    plateNumber: "NCA 1024", status: "available", featured: false,
  },
  {
    id: "veh-02", slug: "mitsubishi-mirage-g4-2023", name: "Mitsubishi Mirage G4", make: "Mitsubishi", model: "Mirage G4", year: 2023,
    category: "sedan", transmission: "manual", fuel: "gasoline", seats: 5, pricePerDay: 1500,
    description: "A budget sedan with a roomy trunk for luggage. Great for airport trips.",
    features: ["Air conditioning", "Bluetooth audio", "Large trunk", "Dual airbags"],
    plateNumber: "NDB 2231", status: "available", featured: false,
  },
  {
    id: "veh-03", slug: "toyota-vios-2024", name: "Toyota Vios", make: "Toyota", model: "Vios", year: 2024,
    category: "sedan", transmission: "automatic", fuel: "gasoline", seats: 5, pricePerDay: 1800,
    description: "The everyday favorite. Comfortable, reliable and easy to drive in traffic.",
    features: ["Automatic transmission", "Air conditioning", "Touchscreen audio", "Rear parking sensors", "Dual airbags"],
    plateNumber: "NEA 4410", status: "available", featured: true,
  },
  {
    id: "veh-04", slug: "honda-city-2024", name: "Honda City", make: "Honda", model: "City", year: 2024,
    category: "sedan", transmission: "automatic", fuel: "gasoline", seats: 5, pricePerDay: 2100,
    description: "A stylish sedan with a spacious cabin and smooth ride for city and highway.",
    features: ["Automatic transmission", "Air conditioning", "Apple CarPlay", "Reverse camera", "Six airbags"],
    plateNumber: "NFC 8830", status: "available", featured: false,
  },
  {
    id: "veh-05", slug: "mitsubishi-xpander-2024", name: "Mitsubishi Xpander", make: "Mitsubishi", model: "Xpander", year: 2024,
    category: "mpv", transmission: "automatic", fuel: "gasoline", seats: 7, pricePerDay: 2600,
    description: "A seven-seater MPV that fits the whole family and their bags.",
    features: ["Automatic transmission", "Rear air conditioning", "Touchscreen audio", "Reverse camera", "Third row seats"],
    plateNumber: "NGD 5512", status: "available", featured: true,
  },
  {
    id: "veh-06", slug: "toyota-innova-2023", name: "Toyota Innova", make: "Toyota", model: "Innova", year: 2023,
    category: "mpv", transmission: "automatic", fuel: "diesel", seats: 7, pricePerDay: 2800,
    description: "A tough and comfortable diesel MPV for long family trips.",
    features: ["Automatic transmission", "Rear air conditioning", "Touchscreen audio", "Rear parking sensors", "Third row seats"],
    plateNumber: "NHE 3308", status: "maintenance", featured: false,
  },
  {
    id: "veh-07", slug: "toyota-corolla-cross-hybrid-2024", name: "Toyota Corolla Cross Hybrid", make: "Toyota", model: "Corolla Cross Hybrid", year: 2024,
    category: "suv", transmission: "automatic", fuel: "hybrid", seats: 5, pricePerDay: 3600,
    description: "A hybrid crossover that saves fuel without giving up space or comfort.",
    features: ["Hybrid engine", "Automatic transmission", "Dual-zone air conditioning", "Reverse camera", "Lane assist"],
    plateNumber: "NJF 7745", status: "available", featured: false,
  },
  {
    id: "veh-08", slug: "byd-atto-3-2024", name: "BYD Atto 3", make: "BYD", model: "Atto 3", year: 2024,
    category: "suv", transmission: "automatic", fuel: "electric", seats: 5, pricePerDay: 4000,
    description: "A fully electric SUV with quiet, smooth acceleration. Charging cable included.",
    features: ["Electric drive", "Panoramic display", "Reverse camera", "Charging cable included", "Six airbags"],
    plateNumber: "NKG 9021", status: "available", featured: false,
  },
  {
    id: "veh-09", slug: "toyota-fortuner-2024", name: "Toyota Fortuner", make: "Toyota", model: "Fortuner", year: 2024,
    category: "suv", transmission: "automatic", fuel: "diesel", seats: 7, pricePerDay: 4200,
    description: "A powerful seven-seater SUV that handles highways and rough roads with ease.",
    features: ["Automatic transmission", "Diesel engine", "Leather seats", "Reverse camera", "Seven airbags"],
    plateNumber: "NLH 1187", status: "available", featured: true,
  },
  {
    id: "veh-10", slug: "toyota-hilux-2023", name: "Toyota Hilux", make: "Toyota", model: "Hilux", year: 2023,
    category: "pickup", transmission: "manual", fuel: "diesel", seats: 5, pricePerDay: 3500,
    description: "A rugged pickup for cargo, provincial roads and outdoor trips.",
    features: ["Diesel engine", "Four-wheel drive option", "Cargo bed", "Air conditioning", "Bluetooth audio"],
    plateNumber: "NMJ 6650", status: "available", featured: false,
  },
  {
    id: "veh-11", slug: "nissan-urvan-2022", name: "Nissan Urvan", make: "Nissan", model: "Urvan", year: 2022,
    category: "van", transmission: "manual", fuel: "diesel", seats: 15, pricePerDay: 3200,
    description: "A 15-seater van for groups, tours and events.",
    features: ["15 passenger seats", "Diesel engine", "Air conditioning", "Large luggage space"],
    plateNumber: "NNK 2249", status: "available", featured: false,
  },
  {
    id: "veh-12", slug: "toyota-hiace-grandia-2024", name: "Toyota HiAce Grandia", make: "Toyota", model: "HiAce Grandia", year: 2024,
    category: "van", transmission: "automatic", fuel: "diesel", seats: 12, pricePerDay: 4800,
    description: "A premium 12-seater van with extra legroom for comfortable group travel.",
    features: ["12 passenger seats", "Automatic transmission", "Dual air conditioning", "Reverse camera", "Captain-style seats"],
    plateNumber: "NPL 8873", status: "available", featured: true,
  },
];

export const seedVehicles: Vehicle[] = vehicles.map((v) => ({ ...v, images: photos(v.name) }));
