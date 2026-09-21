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

export type SectionVariant = "default" | "muted";

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
  return (
    <section
      className={cn("py-section", variant === "muted" && "bg-surface-muted", className)}
      {...props}
    >
      <Container size={size} className={containerClassName}>
        {children}
      </Container>
    </section>
  );
}

/** Page title block: one <h1>, optional description and action buttons. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <h1>{title}</h1>
        {description && <p className="max-w-narrow text-lg text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
