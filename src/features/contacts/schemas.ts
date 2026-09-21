import { z } from "zod";
import { content } from "@/content";
import { CONTACT_TYPES } from "@/lib/constants";

const t = content.admin.contacts;

export const contactDetailSchema = z
  .object({
    type: z.enum(CONTACT_TYPES),
    label: z.string().trim(),
    value: z.string().trim().min(1, content.validation.required),
  })
  .superRefine((detail, ctx) => {
    if (detail.type === "email") {
      if (!z.email().safeParse(detail.value).success) {
        ctx.addIssue({ code: "custom", path: ["value"], message: t.invalidEmail });
      }
    } else if (!/^\+?[\d\s\-()]{7,}$/.test(detail.value)) {
      ctx.addIssue({ code: "custom", path: ["value"], message: t.invalidPhone });
    }
  });

export type ContactDetailFormValues = z.infer<typeof contactDetailSchema>;
