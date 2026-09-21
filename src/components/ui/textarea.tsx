"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { controlStyles, controlVariants, type ControlVariant } from "./control-styles";
import { useFieldControl } from "./form-field";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: ControlVariant;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { variant = "default", className, rows = 4, ...props },
  ref,
) {
  const field = useFieldControl();
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(controlStyles, "py-2", controlVariants[variant], className)}
      {...field}
      {...props}
    />
  );
});
