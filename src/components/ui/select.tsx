"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { controlStyles, controlVariants, type ControlVariant } from "./control-styles";
import { useFieldControl } from "./form-field";
import { ChevronDownIcon } from "./icons";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  variant?: ControlVariant;
}

/**
 * A native <select>: best keyboard and phone behavior, and works directly with
 * React Hook Form. Pass <option> elements as children. `className` styles the wrapper.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { variant = "default", className, children, ...props },
  ref,
) {
  const field = useFieldControl();
  return (
    <div className={cn("relative", className)}>
      <select
        ref={ref}
        className={cn(controlStyles, controlVariants[variant], "appearance-none pr-10")}
        {...field}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" />
    </div>
  );
});
