import Link from "next/link";
import { Button, ButtonArrow, Card, Section } from "@/components/ui";

/**
 * A closing call to action: one heading and one button on a raised block, the same lift as the home page
 * booking bar and the special offers ask, so "the thing to do next" always looks the same across the site.
 */
export function CtaBanner({ title, buttonLabel, href }: { title: string; buttonLabel: string; href: string }) {
  return (
    <Section aria-labelledby="cta-heading" className="pt-0 md:pt-0">
      <Card
        variant="raised"
        className="gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 md:px-10 md:py-8"
      >
        <h2 id="cta-heading" className="text-2xl font-extrabold tracking-display md:text-3xl">
          {title}
        </h2>
        {/* Hover: the button rises a step onto a deeper shadow while its arrow nudges forward; the press
            scale settles it back. Full width on phones, where it is a thumb target. */}
        <Button
          asChild
          size="lg"
          variant="accent"
          className="w-full shrink-0 hover:shadow-lg sm:w-auto motion-safe:hover:-translate-y-0.5"
        >
          <Link href={href}>
            {buttonLabel}
            <ButtonArrow />
          </Link>
        </Button>
      </Card>
    </Section>
  );
}
