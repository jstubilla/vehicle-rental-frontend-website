"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, className, id, ...props },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  const descId = `${inputId}-desc`;

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input
        ref={ref}
        type="checkbox"
        id={inputId}
        aria-describedby={description ? descId : undefined}
        className="mt-0.5 size-5 shrink-0 accent-primary disabled:cursor-not-allowed"
        {...props}
      />
      <div className="flex flex-col">
        <label htmlFor={inputId} className="text-base text-foreground">
          {label}
        </label>
        {description && (
          <p id={descId} className="text-sm text-muted">
            {description}
          </p>
        )}
      </div>
    </div>
  );
});
