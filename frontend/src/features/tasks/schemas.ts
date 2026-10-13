import { z } from "zod";
import { content } from "@/content";

const t = content.admin.tasks.form;

export const taskFormSchema = z
  .object({
    title: z.string().trim().min(2, content.validation.required),
    notes: z.string().trim(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t.dueRequired),
    /** User id, or "" for unassigned. */
    assigneeId: z.string(),
    linkType: z.enum(["none", "lead", "customer"]),
    /** Lead or customer id, or "" when nothing is linked. */
    linkId: z.string(),
  })
  .refine((value) => value.linkType === "none" || value.linkId !== "", {
    path: ["linkId"],
    message: t.linkRequired,
  });

export type TaskFormValues = z.infer<typeof taskFormSchema>;
