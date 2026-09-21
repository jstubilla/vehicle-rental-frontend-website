import { redirect } from "next/navigation";
import { stepPath } from "@/features/booking/steps";

/** /book has no page of its own: it starts at step 1. */
export default function BookPage() {
  redirect(stepPath("dates"));
}
