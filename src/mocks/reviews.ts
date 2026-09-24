import type { Review } from "@/types";
import { seedBookings } from "./bookings";
import { timestampAt } from "./helpers";

type Row = [name: string, rating: number, comment: string, published: boolean];

// 7 reviews: 4 shown on the website, 3 still private. Each uses a real seeded booking reference.
const rows: Row[] = [
  ["Rosalinda Fuentes", 5, "Smooth pick-up at the airport and the car was spotless. Will book again.", true],
  ["Mark Villanueva", 5, "Reliable for our company trips. Staff always answer quickly.", true],
  ["Camille Rivera", 4, "Good car and fair price. The return process took a little long.", true],
  ["Jun Reyes", 5, "Booking took a few minutes and the price was exactly as shown.", true],
  ["Trisha Valdez", 3, "The car was fine but I waited about 30 minutes at pick-up.", false],
  ["Gerald Uy", 2, "The van had a warning light on. It was sorted, but I was worried.", false],
  ["Hazel Ocampo", 4, "Friendly driver contact and easy directions to the meeting point.", false],
];

export const seedReviews: Review[] = rows.map(([name, rating, comment, published], index) => ({
  id: `rev-${String(index + 1).padStart(2, "0")}`,
  name,
  rating,
  comment,
  bookingReference: seedBookings[index].reference,
  published,
  createdAt: timestampAt(-(index * 3 + 1)),
}));
