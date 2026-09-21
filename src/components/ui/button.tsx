import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md border font-medium whitespace-nowrap no-underline disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "border-primary bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary: "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary-hover",
  outline: "border-border-strong bg-transparent text-foreground hover:bg-surface-muted",
  ghost: "border-transparent bg-transparent text-foreground hover:bg-surface-muted",
  danger: "border-danger bg-danger text-danger-foreground hover:bg-danger-hover",
  link: "min-h-0 border-transparent bg-transparent px-0 text-link underline underline-offset-4 hover:no-underline",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-control-sm px-3 text-sm",
  md: "min-h-control px-4 text-base",
  lg: "min-h-control-lg px-6 text-lg",
  icon: "size-control p-0",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Disables the button and marks it busy while an action runs. */
  loading?: boolean;
  /** Render the child element (e.g. a <Link>) with button styling. */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    asChild = false,
    className,
    children,
    disabled,
    type = "button",
    ...props
  },
  ref,
) {
  const classes = cn(base, variants[variant], variant === "link" ? "" : sizes[size], className);

  if (asChild) {
    return (
      <Slot.Root ref={ref} className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...props}
    >
      {children}
      {loading && <span aria-hidden="true">…</span>}
    </button>
  );
});
