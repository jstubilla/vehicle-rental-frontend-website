import { z } from "zod";
import { MAX_DAILY_RATE, MIN_DAILY_RATE } from "@/api/pricing";
import { content } from "@/content";

const invalid = content.admin.pricing.invalid;

/** The rate is typed as text and converted to a number when saved. */
export const priceFormSchema = z.object({
  rate: z
    .string()
    .trim()
    .regex(/^\d+$/, invalid)
    .refine((text) => Number(text) >= MIN_DAILY_RATE && Number(text) <= MAX_DAILY_RATE, invalid),
});

export type PriceFormValues = z.infer<typeof priceFormSchema>;
