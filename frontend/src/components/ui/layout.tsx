import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ContainerSize = "page" | "narrow" | "form";

const containerSizes: Record<ContainerSize, string> = {
  page: "max-w-page",
  narrow: "max-w-narrow",
  form: "max-w-form",
};

/** Centers content and applies the page gutter and max width. */
export function Container({
  size = "page",
  as: Tag = "div",
  className,
  ...props
}: HTMLAttributes<HTMLElement> & { size?: ContainerSize; as?: ElementType }) {
  return <Tag className={cn("mx-auto w-full px-gutter", containerSizes[size], className)} {...props} />;
}

/** "ruled" opens the section with a hairline rule: the default way to separate sections on public pages. */
export type SectionVariant = "default" | "ruled";

/** A full-width band of a page with consistent vertical spacing. */
export function Section({
  variant = "default",
  size = "page",
  className,
  containerClassName,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & {
  variant?: SectionVariant;
  size?: ContainerSize;
  containerClassName?: string;
}) {
  if (variant === "ruled") {
    return (
      // No top padding: the rule sits where the previous section's bottom padding ends.
      <section className={cn("pb-section md:pb-section-lg", className)} {...props}>
        <Container size={size} className={containerClassName}>
          <div aria-hidden="true" className="mb-section border-t border-border md:mb-section-lg" />
          {children}
        </Container>
      </section>
    );
  }

  return (
    <section className={cn("py-section md:py-section-lg", className)} {...props}>
      <Container size={size} className={containerClassName}>
        {children}
      </Container>
    </section>
  );
}

/**
 * A full-width tinted band that groups several sections into one zone (e.g. the home page's vehicles
 * and how-it-works). Use once or twice per page at most: it marks a change of subject, not every section.
 *
 * "continuous" has no top rule: its tint rises out of the section above (see .band-continuous), so a
 * hero backdrop can fade through its top edge instead of being cut by it. It is positioned, so its
 * content always paints above that backdrop.
 */
export function Band({
  variant = "default",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: "default" | "continuous" }) {
  return (
    <div
      className={cn(
        variant === "continuous" ? "band-continuous relative border-b border-border" : "border-y border-border bg-surface",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Page title block: one <h1>, optional description and action buttons. */
export function PageHeader({
  title,
  description,
  actions,
  className,
  display = false,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  /** Set the title in display type (the home hero's size), for a page that is carried by its type alone. */
  display?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("flex flex-col", display ? "gap-4" : "gap-2")}>
        <h1 className={display ? "text-display" : "text-4xl font-extrabold tracking-display md:text-5xl"}>{title}</h1>
        {description && <p className="max-w-prose text-lg text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
