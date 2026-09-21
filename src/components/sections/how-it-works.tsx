import { Card, CardContent, CardHeader, CardTitle, Section } from "@/components/ui";

export function HowItWorks({
  title,
  steps,
}: {
  title: string;
  steps: readonly { title: string; body: string }[];
}) {
  return (
    <Section variant="muted" aria-labelledby="how-it-works-heading">
      <h2 id="how-it-works-heading" className="mb-6">
        {title}
      </h2>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.title}>
            <Card className="h-full">
              <CardHeader>
                <span
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-full border border-border-strong font-semibold"
                >
                  {index + 1}
                </span>
                <CardTitle as="h3">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted">{step.body}</CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </Section>
  );
}
