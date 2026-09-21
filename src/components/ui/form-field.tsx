"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { content } from "@/content";

interface FieldContextValue {
  id: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/**
 * Lets Input / Select / Textarea / DatePicker pick up their id and aria attributes
 * automatically when placed inside a <FormField>. Explicit props still win.
 */
export function useFieldControl() {
  const ctx = useContext(FieldContext);
  if (!ctx) return {};
  return {
    id: ctx.id,
    "aria-describedby": ctx.describedBy,
    "aria-invalid": ctx.invalid ? (true as const) : undefined,
    "aria-required": ctx.required ? (true as const) : undefined,
  };
}

interface FieldChromeProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

function RequiredMark() {
  return (
    <>
      <span aria-hidden="true"> *</span>
      <span className="sr-only"> ({content.ui.required})</span>
    </>
  );
}

/** Label + control + hint + error message, wired together for screen readers. */
export function FormField({ label, hint, error, required, className, children }: FieldChromeProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <FieldContext value={{ id, describedBy, invalid: Boolean(error), required: Boolean(required) }}>
      <div className={cn("flex flex-col gap-1.5", className)}>
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
          {required && <RequiredMark />}
        </label>
        {children}
        {hint && (
          <p id={hintId} className="text-sm text-muted">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </div>
    </FieldContext>
  );
}

/** Same as FormField but for a set of related controls (radio buttons, checkboxes). */
export function FieldGroup({ label, hint, error, required, className, children }: FieldChromeProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <fieldset aria-describedby={describedBy} className={cn("flex flex-col gap-2", className)}>
      <legend className="mb-1 text-sm font-medium text-foreground">
        {label}
        {required && <RequiredMark />}
      </legend>
      {children}
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
