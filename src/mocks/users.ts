import type { User } from "@/types";
import { timestampAt } from "./helpers";

/** Demo staff. All use the demo password (see src/api/auth.ts). One is deactivated to show that state. */
export const seedUsers: User[] = [
  { id: "usr-01", name: "Ramon Villareal", email: "admin@carrental.example", roleId: "role-admin", active: true, createdAt: timestampAt(-200) },
  { id: "usr-02", name: "Liza Manalo", email: "liza.manalo@carrental.example", roleId: "role-sales", active: true, createdAt: timestampAt(-150) },
  { id: "usr-03", name: "Enzo Carreon", email: "enzo.carreon@carrental.example", roleId: "role-sales", active: true, createdAt: timestampAt(-120) },
  { id: "usr-04", name: "Beatriz Aquino", email: "accounting@carrental.example", roleId: "role-accountant", active: true, createdAt: timestampAt(-100) },
  { id: "usr-05", name: "Dennis Ocampo", email: "operations@carrental.example", roleId: "role-operations", active: true, createdAt: timestampAt(-90) },
  { id: "usr-06", name: "Marco Estrada", email: "marco.estrada@carrental.example", roleId: "role-sales", active: false, createdAt: timestampAt(-180) },
];
