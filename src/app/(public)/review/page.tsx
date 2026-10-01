import type { Metadata } from "next";
import { Card, PageHeader, Section } from "@/components/ui";
import { content } from "@/content";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { buildMetadata } from "@/lib/seo";

const t = content.reviews;

export const metadata: Metadata = buildMetadata({ ...t.meta, path: "/review" });

/** The title holds the left; the form sits raised on the right, the one thing to do on this page. */
export default function ReviewPage() {
  return (
    <Section>
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <PageHeader display title={t.title} description={t.subtitle} className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start" />

        <Card
          as="section"
          variant="raised"
          aria-labelledby="review-form-heading"
          className="gap-6 p-5 sm:p-6 md:p-8 lg:col-span-7"
        >
          <h2 id="review-form-heading" className="text-2xl font-extrabold tracking-display">
            {t.form.title}
          </h2>
          <ReviewForm />
        </Card>
      </div>
    </Section>
  );
}
