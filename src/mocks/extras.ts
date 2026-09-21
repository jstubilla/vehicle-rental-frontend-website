import type { Extra } from "@/types";

export const seedExtras: Extra[] = [
  { id: "ext-child-seat", name: "Child seat", description: "Suitable for children aged 1 to 5.", price: 150, pricing: "per_day" },
  { id: "ext-gps", name: "GPS navigation", description: "Portable GPS unit with Philippine maps.", price: 200, pricing: "per_day" },
  { id: "ext-wifi", name: "Pocket Wi-Fi", description: "Mobile internet for the whole trip.", price: 250, pricing: "per_day" },
  { id: "ext-driver", name: "Additional driver", description: "Add a second authorized driver.", price: 500, pricing: "flat" },
];
