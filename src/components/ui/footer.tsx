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
  default: "border-t border-border bg-surface text-foreground",
  inverted: "bg-primary text-primary-foreground",
};

export interface FooterProps {
  brand: ReactNode;
  description?: string;
  /** Phone number, shown large as a tap-to-call link: the first thing in the footer. */
  phone?: { label: string; number: string };
  columns: readonly FooterColumn[];
  /** Social links block, already rendered (e.g. <SocialLinks />). Sits under the phone number. */
  socials?: ReactNode;
  socialsTitle?: string;
  legal?: string;
  /** Small links in the bottom strip, after the legal line (e.g. the staff login). */
  legalLinks?: readonly { label: string; href: string }[];
  /** Optional credit shown on the right of the bottom strip (on phones, under the legal line). */
  credit?: string;
  variant?: FooterVariant;
  className?: string;
}

/** Public site footer: phone and brand first, then two compact link groups, then the legal strip. */
export function Footer({
  brand,
  description,
  phone,
  columns,
  socials,
  socialsTitle,
  legal,
  legalLinks,
  credit,
  variant = "default",
  className,
}: FooterProps) {
  return (
    <footer className={cn(variants[variant], className)}>
      <Container className="grid gap-10 py-section md:grid-cols-12 md:gap-8">
        <div className="flex flex-col gap-5 md:col-span-6 lg:col-span-5">
          {phone && (
            <p className="flex flex-col gap-1">
              <span className="text-sm text-muted">{phone.label}</span>
              <a
                href={`tel:${phone.number.replace(/[^+\d]/g, "")}`}
                className="font-heading text-3xl font-bold tracking-tight text-foreground no-underline tabular-nums underline-offset-4 hover:underline"
              >
                {phone.number}
              </a>
            </p>
          )}
          <div className="flex flex-col gap-2">
            {brand}
            {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
          </div>
          {socials && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {socialsTitle && <h2 className="text-sm font-normal text-muted">{socialsTitle}</h2>}
              {socials}
            </div>
          )}
        </div>

        {columns.map((column, index) => (
          <nav
            key={column.title}
            aria-label={column.title}
            className={cn("md:col-span-3 lg:col-span-2", index === 0 && "lg:col-start-9")}
          >
            <h2 className="mb-3 text-sm font-semibold">{column.title}</h2>
            <ul className="flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted no-underline underline-offset-4 transition-colors duration-(--duration-fast) hover:text-foreground hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      {(legal || credit) && (
        <div className="border-t border-border">
          <Container className="flex flex-col gap-1 py-4 text-sm text-muted md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {legal && <p>{legal}</p>}
              {legalLinks?.map((link) => (
                <Link key={link.href} href={link.href} className="text-muted underline-offset-4 hover:underline">
                  {link.label}
                </Link>
              ))}
            </div>
            {credit && <p>{credit}</p>}
          </Container>
        </div>
      )}
    </footer>
  );
}
