import type { ReactNode } from "react";
import { Section } from "@/components/ui";

/** A page section set as two columns: the heading on the left, the body on the right. Stacks on phones. */
export function EditorialSection({
  id,
  title,
  titleClassName,
  rule = true,
  className,
  children,
}: {
  /** Base for the heading id; the section is labelled by it. */
  id: string;
  title: string;
  titleClassName?: string;
  /** Open with a hairline rule. Off when something else already separates it (a band edge, the page top). */
  rule?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Section variant={rule ? "ruled" : "default"} aria-labelledby={`${id}-heading`} className={className}>
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-12">
        <h2 id={`${id}-heading`} className={titleClassName ?? "lg:col-span-4"}>
          {title}
        </h2>
        <div className="flex flex-col gap-4 lg:col-span-8">{children}</div>
      </div>
    </Section>
  );
}
