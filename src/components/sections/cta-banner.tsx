import Link from "next/link";
import { Button, Card, Section } from "@/components/ui";

/** A closing "call to action" band with a heading and one button. */
export function CtaBanner({
  title,
  description,
  buttonLabel,
  href,
}: {
  title: string;
  description?: string;
  buttonLabel: string;
  href: string;
}) {
  return (
    <Section aria-labelledby="cta-heading">
      <Card variant="muted" className="items-center gap-4 p-8 text-center md:p-12">
        <h2 id="cta-heading">{title}</h2>
        {description && <p className="max-w-narrow text-muted">{description}</p>}
        <Button asChild size="lg" variant="accent">
          <Link href={href}>{buttonLabel}</Link>
        </Button>
      </Card>
    </Section>
  );
}
