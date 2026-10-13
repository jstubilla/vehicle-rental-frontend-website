"use client";

import { useId } from "react";
import { content } from "@/content";
import { cn } from "@/lib/cn";
import { StarIcon } from "./icons";

const STARS = [1, 2, 3, 4, 5] as const;

/** Read-only stars. Screen readers hear "4 out of 5 stars" once, not five icons. */
export function StarRating({ value, className }: { value: number; className?: string }) {
  return (
    <span role="img" aria-label={content.ui.rating.stars(value)} className={cn("inline-flex gap-0.5 text-price", className)}>
      {STARS.map((n) => (
        <StarIcon key={n} filled={n <= value} className={cn("size-5", n > value && "text-border-strong")} />
      ))}
    </span>
  );
}

export interface StarRatingInputProps {
  /** 0 means nothing chosen yet. */
  value: number;
  onChange: (value: number) => void;
  name?: string;
  className?: string;
}

/**
 * Pick 1 to 5 stars. Built from real radio buttons, so the arrow keys move between
 * stars and screen readers announce "3 stars, radio button, 3 of 5". Put it inside a FieldGroup for the label.
 */
export function StarRatingInput({ value, onChange, name, className }: StarRatingInputProps) {
  const generated = useId();
  const groupName = name ?? generated;

  return (
    <div className={cn("flex gap-1", className)}>
      {STARS.map((n) => (
        <label
          key={n}
          className="cursor-pointer rounded-md p-1 text-price has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
        >
          <input
            type="radio"
            name={groupName}
            value={n}
            checked={value === n}
            onChange={() => onChange(n)}
            className="sr-only"
          />
          <span className="sr-only">{content.ui.rating.option(n)}</span>
          <StarIcon filled={n <= value} aria-hidden="true" className={cn("size-8", n > value && "text-border-strong")} />
        </label>
      ))}
    </div>
  );
}
