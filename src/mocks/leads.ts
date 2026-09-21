import type { LeadSource, LeadStage } from "@/lib/constants";
import type { Lead } from "@/types";
import { timestampAt } from "./helpers";

type Row = [
  name: string,
  email: string,
  phone: string,
  source: LeadSource,
  stage: LeadStage,
  vehicleId: string | null,
  message: string,
  assignee: string | null,
  customerId: string | null,
  createdDaysAgo: number,
  updatedDaysAgo: number,
];

// 15 leads: 4 new, 3 contacted, 3 qualified, 3 won, 2 lost. Won leads are linked to customers.
const rows: Row[] = [
  ["Rica Mae Salvador", "rica.salvador@example.com", "+63 917 301 1101", "website", "new", "veh-03", "Looking for a sedan for 5 days in October.", null, null, 1, 1],
  ["Anton Legaspi", "anton.legaspi@example.com", "+63 918 302 2202", "facebook", "new", "veh-09", "Do you have a Fortuner for a family trip to Baguio?", null, null, 2, 2],
  ["Hazel Dimaculangan", "hazel.dimaculangan@example.com", "+63 919 303 3303", "phone", "new", null, "Asking about airport pick-up rates.", "usr-03", null, 3, 2],
  ["Noel Bernardo", "noel.bernardo@example.com", "+63 920 304 4404", "website", "new", "veh-12", "Need a 12-seater van for a company outing.", null, null, 1, 1],
  ["Trisha Valdez", "trisha.valdez@example.com", "+63 921 305 5505", "website", "contacted", "veh-05", "Family of 7 needs an MPV for a weekend.", "usr-02", null, 6, 5],
  ["Gerald Uy", "gerald.uy@example.com", "+63 922 306 6606", "referral", "contacted", "veh-04", "Referred by a past customer. Wants a sedan with a driver option.", "usr-03", null, 8, 7],
  ["Bea Salonga", "bea.salonga@example.com", "+63 927 307 7707", "facebook", "contacted", null, "Comparing prices for a week-long rental in Cebu.", "usr-02", null, 9, 8],
  ["Kiko Mercado", "kiko.mercado@example.com", "+63 928 308 8808", "phone", "qualified", "veh-10", "Needs a pickup for a 2-week provincial project.", "usr-02", null, 12, 10],
  ["Lorna Feliciano", "lorna.feliciano@example.com", "+63 929 309 9909", "website", "qualified", "veh-08", "Interested in trying an electric SUV.", "usr-03", null, 14, 12],
  ["Vincent Ang", "vincent.ang@example.com", "+63 930 310 1010", "walk_in", "qualified", "veh-11", "Van for a wedding party of 14.", "usr-02", null, 16, 14],
  ["Mark Villanueva", "mark.villanueva@example.com", "+63 921 567 8905", "referral", "won", "veh-09", "Corporate rental for site visits.", "usr-02", "cus-05", 32, 28],
  ["Jasmine Sy", "jasmine.sy@example.com", "+63 946 890 1218", "website", "won", "veh-05", "Wedding rental inquiry.", "usr-03", "cus-18", 27, 23],
  ["Camille Rivera", "camille.rivera@example.com", "+63 948 012 3420", "phone", "won", "veh-11", "Tour group van rental.", "usr-02", "cus-20", 22, 18],
  ["Dodong Tabora", "dodong.tabora@example.com", "+63 935 311 1111", "facebook", "lost", "veh-01", "Asked for a very low weekly rate.", "usr-03", null, 20, 16],
  ["Pia Magsaysay", "pia.magsaysay@example.com", "+63 936 312 1212", "website", "lost", null, "Went with another company.", "usr-02", null, 24, 20],
];

export const seedLeads: Lead[] = rows.map(
  ([name, email, phone, source, stage, vehicleInterest, message, assigneeId, customerId, created, updated], index) => ({
    id: `lead-${String(index + 1).padStart(2, "0")}`,
    name,
    email,
    phone,
    source,
    stage,
    vehicleInterest,
    message,
    additionalContacts: [],
    assigneeId,
    customerId,
    createdAt: timestampAt(-created, "10:30"),
    updatedAt: timestampAt(-updated, "14:15"),
  }),
);
