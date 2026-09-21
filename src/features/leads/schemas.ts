import { z } from "zod";
import { content } from "@/content";
import { LEAD_SOURCES, LEAD_STAGES } from "@/lib/constants";
import { isPhMobile } from "@/lib/validation";

export const leadFormSchema = z.object({
  name: z.string().trim().min(2, content.validation.required),
  email: z.string().trim().pipe(z.email(content.validation.email)),
  phone: z.string().trim().refine(isPhMobile, content.validation.phone),
  source: z.enum(LEAD_SOURCES),
  stage: z.enum(LEAD_STAGES),
  /** Vehicle id, or "" for no preference. */
  vehicleInterest: z.string(),
  /** User id, or "" for unassigned. */
  assigneeId: z.string(),
  message: z.string().trim(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
