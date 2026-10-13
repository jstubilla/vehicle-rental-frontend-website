import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/cn";
import { ArrowRightIcon, SpinnerIcon } from "./icons";

export type ButtonVariant = "primary" | "accent" | "secondary" | "outline" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const base =
  "group/button inline-flex items-center justify-center gap-2 rounded-md border font-semibold whitespace-nowrap no-underline transition-[background-color,border-color,color,box-shadow,translate,scale] duration-(--duration-fast) ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-primary bg-primary text-primary-foreground shadow-button hover:border-primary-hover hover:bg-primary-hover",
  /** The forward action on public pages (Search, Continue, Send, Book now). One per view. */
  accent:
    "border-accent bg-accent text-accent-foreground shadow-button hover:border-accent-hover hover:bg-accent-hover",
  secondary: "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary-hover",
  outline: "border-border-strong bg-transparent text-foreground hover:border-foreground hover:bg-surface-muted",
  ghost: "border-transparent bg-transparent text-foreground hover:bg-surface-muted",
  danger: "border-danger bg-danger text-danger-foreground hover:border-danger-hover hover:bg-danger-hover",
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
  /**
   * A trailing arrow that nudges forward on hover: for the main "go forward" action of a view
   * (Search vehicles, Book now, Continue). With `asChild`, put <ButtonArrow /> inside the child instead.
   */
  arrow?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    asChild = false,
    arrow = false,
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
      {arrow && !loading && <ButtonArrow />}
      {loading && <SpinnerIcon className="size-4 animate-spin" aria-hidden="true" />}
    </button>
  );
});

/** The forward arrow of a main action. Moves a few pixels on hover; the press scale does the rest. */
export function ButtonArrow() {
  return (
    <ArrowRightIcon
      aria-hidden="true"
      className="-mr-0.5 size-4 transition-transform duration-(--duration-base) ease-out-strong group-hover/button:translate-x-0.5"
    />
  );
}
