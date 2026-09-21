import { z } from "zod";
import { content } from "@/content";

export const userFormSchema = z.object({
  name: z.string().trim().min(2, content.validation.required),
  email: z.string().trim().pipe(z.email(content.validation.email)),
  roleId: z.string().min(1, content.validation.required),
  active: z.boolean(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
