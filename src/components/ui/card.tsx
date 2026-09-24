import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type CardVariant = "default" | "outline" | "muted";

const variants: Record<CardVariant, string> = {
  default: "border border-border bg-card shadow-sm",
  outline: "border border-border-strong bg-transparent",
  muted: "border border-transparent bg-surface-muted",
};

export interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: CardVariant;
  as?: "div" | "section" | "article" | "li" | "figure";
}

export function Card({ variant = "default", as: Tag = "div", className, ...props }: CardProps) {
  return (
    <Tag
      // Cards are light in dark mode; data-surface switches the light theme values on inside them.
      data-surface={variant === "default" ? "card" : undefined}
      className={cn("flex flex-col rounded-lg text-foreground", variants[variant], className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 p-4 md:p-6", className)} {...props} />;
}

export function CardTitle({
  as: Tag = "h3",
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { as?: "h1" | "h2" | "h3" | "h4" }) {
  return <Tag className={cn("text-lg font-semibold", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 p-4 pt-0 md:p-6 md:pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-2 p-4 pt-0 md:p-6 md:pt-0", className)} {...props} />
  );
}
