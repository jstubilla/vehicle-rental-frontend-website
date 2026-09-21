import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "neutral" | "outline" | "solid" | "success" | "warning" | "danger" | "info";

const variants: Record<BadgeVariant, string> = {
  neutral: "border-border bg-secondary text-secondary-foreground",
  outline: "border-border-strong bg-transparent text-foreground",
  solid: "border-primary bg-primary text-primary-foreground",
  success: "border-success bg-success text-success-foreground",
  warning: "border-warning bg-warning text-warning-foreground",
  danger: "border-danger bg-danger text-danger-foreground",
  info: "border-info bg-info text-info-foreground",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
