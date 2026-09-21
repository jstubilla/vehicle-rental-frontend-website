"use client";

import { useState } from "react";
import { Popover } from "radix-ui";
import { DayPicker, type Matcher } from "react-day-picker";
import { format, isValid, parseISO } from "date-fns";
import { cn } from "@/lib/cn";
import { content } from "@/content";
import { controlStyles, controlVariants, type ControlVariant } from "./control-styles";
import { useFieldControl } from "./form-field";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "./icons";

const ISO_DATE = "yyyy-MM-dd";

export interface DatePickerProps {
  /** ISO date string ("2026-03-15") or empty string. Strings avoid time zone bugs. */
  value?: string;
  onChange?: (value: string) => void;
  /** Earliest / latest selectable ISO dates. */
  min?: string;
  max?: string;
  /** Extra rule for blocking dates (e.g. fully booked days). */
  isDateDisabled?: (date: Date) => boolean;
  placeholder?: string;
  disabled?: boolean;
  variant?: ControlVariant;
  className?: string;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

function toDate(value?: string) {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  isDateDisabled,
  placeholder = content.ui.selectDate,
  disabled,
  variant = "default",
  className,
  ...aria
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const field = useFieldControl();
  const selected = toDate(value);
  const minDate = toDate(min);
  const maxDate = toDate(max);

  const disabledMatchers: Matcher[] = [];
  if (minDate) disabledMatchers.push({ before: minDate });
  if (maxDate) disabledMatchers.push({ after: maxDate });
  if (isDateDisabled) disabledMatchers.push(isDateDisabled);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            controlStyles,
            controlVariants[variant],
            "flex items-center justify-between gap-2 text-left data-[invalid=true]:border-2 data-[invalid=true]:border-danger",
            !selected && "text-muted",
            className,
          )}
          id={aria.id ?? field.id}
          aria-describedby={aria["aria-describedby"] ?? field["aria-describedby"]}
          data-invalid={aria["aria-invalid"] ?? field["aria-invalid"]}
        >
          <span>{selected ? format(selected, "d MMM yyyy") : placeholder}</span>
          <CalendarIcon />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-(--z-overlay) rounded-md border border-border-strong bg-surface p-3 text-foreground shadow-md"
        >
          <DayPicker
            mode="single"
            selected={selected}
            defaultMonth={selected ?? minDate}
            startMonth={minDate}
            endMonth={maxDate}
            disabled={disabledMatchers}
            onSelect={(date) => {
              if (!date) return;
              onChange?.(format(date, ISO_DATE));
              setOpen(false);
            }}
            showOutsideDays
            labels={{
              labelPrevious: () => content.ui.previousMonth,
              labelNext: () => content.ui.nextMonth,
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === "left" ? <ChevronLeftIcon /> : <ChevronRightIcon />,
            }}
            classNames={{
              root: "relative",
              months: "flex flex-col gap-4",
              month: "flex flex-col gap-2",
              month_caption: "flex min-h-control-sm items-center justify-center font-medium",
              caption_label: "text-base",
              nav: "absolute inset-x-0 top-0 flex items-center justify-between",
              button_previous:
                "inline-flex size-control-sm items-center justify-center rounded-md hover:bg-surface-muted disabled:opacity-50",
              button_next:
                "inline-flex size-control-sm items-center justify-center rounded-md hover:bg-surface-muted disabled:opacity-50",
              month_grid: "border-collapse",
              weekday: "size-control-sm text-center text-xs font-medium text-muted",
              day: "p-0 text-center",
              day_button:
                "inline-flex size-control-sm items-center justify-center rounded-md text-sm hover:bg-surface-muted focus-visible:outline-solid",
              selected: "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button:hover]:bg-primary-hover",
              today: "font-bold underline",
              outside: "text-muted",
              disabled: "cursor-not-allowed text-muted line-through opacity-50",
              hidden: "invisible",
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
