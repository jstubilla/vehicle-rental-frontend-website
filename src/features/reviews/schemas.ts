import { z } from "zod";
import { content } from "@/content";

export const reviewFormSchema = z.object({
  name: z.string().trim().min(2, content.validation.required),
  /** 0 until the customer picks a star. */
  rating: z.number().int().min(1, content.validation.rating).max(5, content.validation.rating),
  comment: z.string().trim().min(10, content.validation.messageTooShort),
  bookingReference: z.string().trim().min(1, content.validation.required),
});

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;
