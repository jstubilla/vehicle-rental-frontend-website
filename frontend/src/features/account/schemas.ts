import { z } from "zod";
import { content } from "@/content";

const email = z.string().trim().pipe(z.email(content.validation.email));

export const passwordLoginSchema = z.object({
  email,
  password: z.string().min(1, content.validation.required),
});
export type PasswordLoginValues = z.infer<typeof passwordLoginSchema>;

export const codeEmailSchema = z.object({ email });
export type CodeEmailValues = z.infer<typeof codeEmailSchema>;

export const codeSchema = z.object({ code: z.string().trim().regex(/^\d{6}$/, content.validation.code) });
export type CodeValues = z.infer<typeof codeSchema>;

export const signupSchema = z.object({
  name: z.string().trim().min(2, content.validation.required),
  email,
  password: z.string().min(8, content.validation.passwordShort),
});
export type SignupValues = z.infer<typeof signupSchema>;
