"use client";

import { useMemo } from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { content } from "@/content";
import { cn } from "@/lib/cn";
import { controlStyles, controlVariants, type ControlVariant } from "./control-styles";
import { useFieldControl } from "./form-field";
import { CheckIcon, ChevronDownIcon } from "./icons";

export interface TimeSelectProps {
  /** "HH:mm" (24-hour) or empty string. */
  value?: string;
  onChange?: (value: string) => void;
  startHour?: number;
  endHour?: number;
  stepMinutes?: number;
  disabled?: boolean;
  variant?: ControlVariant;
  className?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

function label12h(hour: number, minute: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${pad(minute)} ${suffix}`;
}

/**
 * Pick-up / return time. Shows 12-hour labels, stores 24-hour "HH:mm" values.
 *
 * A Radix listbox rather than a native <select>, so its list can open the same way as the date picker
 * beside it (a short drop and fade, the chevron turning over). It keeps the select keyboard model:
 * arrows, Home/End, type-ahead, Enter/Space to choose, Escape to close with focus back on the field.
 */
export function TimeSelect({
  value,
  onChange,
  startHour = 6,
  endHour = 22,
  stepMinutes = 30,
  disabled,
  variant = "default",
  className,
}: TimeSelectProps) {
  const field = useFieldControl();
  const slots = useMemo(() => {
    const result: { value: string; label: string }[] = [];
    for (let minutes = startHour * 60; minutes <= endHour * 60; minutes += stepMinutes) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      result.push({ value: `${pad(h)}:${pad(m)}`, label: label12h(h, m) });
    }
    return result;
  }, [startHour, endHour, stepMinutes]);

  return (
    <SelectPrimitive.Root value={value ?? ""} onValueChange={(next) => onChange?.(next)} disabled={disabled}>
      <SelectPrimitive.Trigger
        {...field}
        className={cn(
          controlStyles,
          controlVariants[variant],
          "group flex items-center justify-between gap-2 text-left data-placeholder:text-muted",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={content.ui.selectTime} />
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className="text-muted transition-[rotate,color] duration-(--duration-base) ease-out-strong group-hover:text-foreground group-data-[state=open]:rotate-180" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          data-surface="card"
          className={cn(
            "z-(--z-overlay) max-h-60 w-(--radix-select-trigger-width) origin-(--radix-select-content-transform-origin) overflow-hidden rounded-md border border-border-strong bg-card text-foreground shadow-md",
            "data-[state=open]:animate-[popover-in_var(--duration-base)_var(--ease-out-strong)]",
            "data-[state=closed]:animate-[popover-out_var(--duration-fast)_var(--ease-out-strong)]",
          )}
        >
          <SelectPrimitive.Viewport className="max-h-(--radix-select-content-available-height) p-1">
            {slots.map((slot) => (
              <SelectPrimitive.Item
                key={slot.value}
                value={slot.value}
                className="flex min-h-control-sm cursor-default items-center justify-between gap-2 rounded-md px-3 text-sm tabular-nums outline-none select-none data-highlighted:bg-surface-muted data-[state=checked]:font-semibold"
              >
                <SelectPrimitive.ItemText>{slot.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <CheckIcon className="text-primary" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
