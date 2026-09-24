import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, PageHeader, Section } from "@/components/ui";
import { content } from "@/content";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { buildMetadata } from "@/lib/seo";

const t = content.reviews;

export const metadata: Metadata = buildMetadata({ ...t.meta, path: "/review" });

export default function ReviewPage() {
  return (
    <>
      <Section className="pb-0">
        <PageHeader title={t.title} description={t.subtitle} />
      </Section>

      <Section>
        <Card as="section" aria-labelledby="review-form-heading" className="max-w-2xl">
          <CardHeader>
            <CardTitle as="h2" id="review-form-heading" className="text-2xl">
              {t.form.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewForm />
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
