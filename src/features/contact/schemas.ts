import { z } from "zod";
import { content } from "@/content";
import { isPhMobile } from "@/lib/validation";

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, content.validation.required),
  email: z.string().trim().pipe(z.email(content.validation.email)),
  phone: z.string().trim().refine(isPhMobile, content.validation.phone),
  /** Vehicle id, or "" for no preference. */
  vehicleId: z.string(),
  message: z.string().trim().min(10, content.validation.messageTooShort),
  consent: z.boolean().refine((checked) => checked, content.validation.consent),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
