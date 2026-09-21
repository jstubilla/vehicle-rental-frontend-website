import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Container } from "./layout";

export interface FooterColumn {
  title: string;
  links: readonly { label: string; href: string }[];
}

export type FooterVariant = "default" | "inverted";

const variants: Record<FooterVariant, string> = {
  default: "border-t border-border bg-surface-muted text-foreground",
  inverted: "bg-primary text-primary-foreground",
};

export interface FooterProps {
  brand: ReactNode;
  description?: string;
  columns: readonly FooterColumn[];
  /** Social links block, already rendered (e.g. <SocialLinks />). */
  socials?: ReactNode;
  socialsTitle?: string;
  legal?: string;
  variant?: FooterVariant;
  className?: string;
}

/** Public site footer: brand, link columns, social links and legal line. */
export function Footer({
  brand,
  description,
  columns,
  socials,
  socialsTitle,
  legal,
  variant = "default",
  className,
}: FooterProps) {
  return (
    <footer className={cn(variants[variant], className)}>
      <Container className="grid gap-8 py-section md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          {brand}
          {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="mb-3 text-base font-semibold">{column.title}</h2>
            <ul className="flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-inherit underline-offset-4 hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {socials && (
          <div>
            {socialsTitle && <h2 className="mb-3 text-base font-semibold">{socialsTitle}</h2>}
            {socials}
          </div>
        )}
      </Container>
      {legal && (
        <div className="border-t border-border">
          <Container className="py-4 text-sm text-muted">{legal}</Container>
        </div>
      )}
    </footer>
  );
}
