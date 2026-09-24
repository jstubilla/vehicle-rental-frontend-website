"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  /** "list" = plain rows, "cards" = each option is a bordered box. */
  variant?: "list" | "cards";
  className?: string;
}

/** Native radio buttons. Wrap in <FieldGroup> to add a legend and error message. */
export function RadioGroup({
  name,
  options,
  value,
  onValueChange,
  variant = "list",
  className,
}: RadioGroupProps) {
  const groupId = useId();

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {options.map((option) => {
        const inputId = `${groupId}-${option.value}`;
        return (
          <label
            key={option.value}
            htmlFor={inputId}
            data-surface={variant === "cards" ? "card" : undefined}
            className={cn(
              "flex items-start gap-3",
              variant === "cards" &&
                "cursor-pointer rounded-md border border-border-strong bg-card p-4 has-checked:border-2 has-checked:border-primary has-disabled:cursor-not-allowed has-disabled:bg-surface-muted",
            )}
          >
            <input
              type="radio"
              id={inputId}
              name={name}
              value={option.value}
              checked={value === undefined ? undefined : value === option.value}
              onChange={() => onValueChange?.(option.value)}
              disabled={option.disabled}
              className="mt-0.5 size-5 shrink-0 accent-primary"
            />
            <span className="flex flex-col">
              <span className="text-base text-foreground">{option.label}</span>
              {option.description && (
                <span className="text-sm text-muted">{option.description}</span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}
