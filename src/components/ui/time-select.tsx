"use client";

import { useMemo } from "react";
import { Select, type SelectProps } from "./select";
import { content } from "@/content";

export interface TimeSelectProps extends Omit<SelectProps, "value" | "onChange" | "children"> {
  /** "HH:mm" (24-hour) or empty string. */
  value?: string;
  onChange?: (value: string) => void;
  startHour?: number;
  endHour?: number;
  stepMinutes?: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

function label12h(hour: number, minute: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${pad(minute)} ${suffix}`;
}

/** Pick-up / return time. Shows 12-hour labels, stores 24-hour "HH:mm" values. */
export function TimeSelect({
  value,
  onChange,
  startHour = 6,
  endHour = 22,
  stepMinutes = 30,
  ...props
}: TimeSelectProps) {
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
    <Select value={value ?? ""} onChange={(e) => onChange?.(e.target.value)} {...props}>
      <option value="" disabled>
        {content.ui.selectTime}
      </option>
      {slots.map((slot) => (
        <option key={slot.value} value={slot.value}>
          {slot.label}
        </option>
      ))}
    </Select>
  );
}
