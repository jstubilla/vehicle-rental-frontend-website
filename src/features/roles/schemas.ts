import { z } from "zod";
import { content } from "@/content";
import { PERMISSIONS } from "@/lib/constants";

export const roleFormSchema = z.object({
  name: z.string().trim().min(2, content.validation.required),
  description: z.string().trim(),
  permissions: z.array(z.enum(PERMISSIONS)).min(1, content.admin.roles.form.permissionsRequired),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
