import { z } from "zod";
import { content } from "@/content";
import { isPhMobile } from "@/lib/validation";

export const customerFormSchema = z.object({
  name: z.string().trim().min(2, content.validation.required),
  email: z.string().trim().pipe(z.email(content.validation.email)),
  phone: z.string().trim().refine(isPhMobile, content.validation.phone),
  licenseNumber: z.string().trim(),
  notes: z.string().trim(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
