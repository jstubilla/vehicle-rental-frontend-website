"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { controlStyles, controlVariants, type ControlVariant } from "./control-styles";
import { useFieldControl } from "./form-field";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: ControlVariant;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { variant = "default", className, ...props },
  ref,
) {
  const field = useFieldControl();
  return (
    <input
      ref={ref}
      className={cn(controlStyles, controlVariants[variant], className)}
      {...field}
      {...props}
    />
  );
});
