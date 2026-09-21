import { z } from "zod";
import { content } from "@/content";
import { rentalFields, returnAfterPickup } from "@/lib/rental";
import { isPhMobile } from "@/lib/validation";

/** Step 1. `sameReturn` = "return to the pick-up location". */
export const datesFormSchema = rentalFields
  .extend({ sameReturn: z.boolean(), returnLocation: z.string() })
  .refine(returnAfterPickup.check, returnAfterPickup.error)
  .refine((v) => v.sameReturn || v.returnLocation !== "", {
    path: ["returnLocation"],
    message: content.validation.required,
  });

export type DatesFormValues = z.infer<typeof datesFormSchema>;

/** Step 3. */
export const detailsFormSchema = z.object({
  name: z.string().trim().min(2, content.validation.required),
  email: z.string().trim().pipe(z.email(content.validation.email)),
  phone: z.string().trim().refine(isPhMobile, content.validation.phone),
  licenseNumber: z.string().trim().min(5, content.validation.license),
  notes: z.string().trim(),
});

export type DetailsFormValues = z.infer<typeof detailsFormSchema>;
