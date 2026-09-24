import type { Account } from "@/types";
import { timestampAt } from "./helpers";

/** One demo customer who has already booked before, so the saved-details prompt can be tried straight away. */
export const seedAccounts: Account[] = [
  {
    id: "acc-01",
    name: "Maria Santos",
    email: "maria.santos@example.com",
    password: "demo1234", // same demo password as the staff accounts
    phone: "0917 555 0100",
    licenseNumber: "N01-23-456789",
    createdAt: timestampAt(-40),
  },
];
