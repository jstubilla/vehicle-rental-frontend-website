import type { Customer } from "@/types";
import { timestampAt } from "./helpers";

const rows: [string, string, string, string, string][] = [
  // name, email, phone, license, notes
  ["Juan Dela Cruz", "juan.delacruz@example.com", "+63 917 123 4501", "N01-23-456701", "Frequent renter. Prefers sedans."],
  ["Maria Santos", "maria.santos@example.com", "+63 918 234 5602", "N02-24-567802", "Usually books for family trips."],
  ["Jose Reyes", "jose.reyes@example.com", "+63 919 345 6703", "N03-22-678903", ""],
  ["Ana Garcia", "ana.garcia@example.com", "+63 920 456 7804", "N04-21-789004", "Requires a child seat."],
  ["Mark Villanueva", "mark.villanueva@example.com", "+63 921 567 8905", "N05-23-890105", "Corporate account (Villanueva Logistics)."],
  ["Angelica Ramos", "angelica.ramos@example.com", "+63 922 678 9006", "N06-24-901206", ""],
  ["Paolo Mendoza", "paolo.mendoza@example.com", "+63 923 789 0107", "N07-20-012307", "Asked for airport pick-up each time."],
  ["Katrina Bautista", "katrina.bautista@example.com", "+63 927 890 1208", "N08-22-123408", ""],
  ["Miguel Castillo", "miguel.castillo@example.com", "+63 928 901 2309", "N09-21-234509", "Needs invoices for his company."],
  ["Sofia Aquino", "sofia.aquino@example.com", "+63 929 012 3410", "N10-23-345610", ""],
  ["Rafael Navarro", "rafael.navarro@example.com", "+63 930 123 4511", "N11-24-456711", "Prefers automatic transmission."],
  ["Isabel Domingo", "isabel.domingo@example.com", "+63 935 234 5612", "N12-22-567812", ""],
  ["Carlo Fernandez", "carlo.fernandez@example.com", "+63 936 345 6713", "N13-21-678913", "Books long weekend trips to Baguio."],
  ["Bianca Torres", "bianca.torres@example.com", "+63 937 456 7814", "N14-23-789014", ""],
  ["Gabriel Cruz", "gabriel.cruz@example.com", "+63 938 567 8915", "N15-24-890115", ""],
  ["Patricia Lim", "patricia.lim@example.com", "+63 939 678 9016", "N16-20-901216", "Referred by Mark Villanueva."],
  ["Daniel Tan", "daniel.tan@example.com", "+63 945 789 0117", "N17-22-012317", ""],
  ["Jasmine Sy", "jasmine.sy@example.com", "+63 946 890 1218", "N18-21-123418", "Wedding rental inquiry, follow up."],
  ["Emmanuel Pascual", "emmanuel.pascual@example.com", "+63 947 901 2319", "N19-23-234519", ""],
  ["Camille Rivera", "camille.rivera@example.com", "+63 948 012 3420", "N20-24-345620", "Tour group organizer."],
];

/** A few customers have extra contact details, to show that feature. */
const extraContacts: Record<number, Customer["additionalContacts"]> = {
  0: [{ id: "cd-01", type: "phone", value: "+63 2 8123 4567", label: "Office" }],
  4: [
    { id: "cd-02", type: "email", value: "accounts@villanueva-logistics.example", label: "Accounts" },
    { id: "cd-03", type: "phone", value: "+63 917 900 1234", label: "Assistant" },
  ],
  19: [{ id: "cd-04", type: "email", value: "camille@riveratours.example", label: "Work" }],
};

export const seedCustomers: Customer[] = rows.map(([name, email, phone, licenseNumber, notes], index) => ({
  id: `cus-${String(index + 1).padStart(2, "0")}`,
  name,
  email,
  phone,
  licenseNumber,
  notes,
  additionalContacts: extraContacts[index] ?? [],
  createdAt: timestampAt(-90 + index * 4),
}));
