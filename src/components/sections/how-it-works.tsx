import { Card, CardContent, CardHeader, CardTitle, CalendarIcon, CarIcon, CreditCardIcon, SteeringWheelIcon, Section } from "@/components/ui";

/** One icon per step, in order. The four steps are always this same journey (dates, vehicle, payment, pick-up). */
const STEP_ICONS = [CalendarIcon, CarIcon, CreditCardIcon, SteeringWheelIcon];

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
        {steps.map((step, index) => {
          const StepIcon = STEP_ICONS[index];
          return (
            <li key={step.title}>
              <Card className="h-full">
                <CardHeader className="gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary font-semibold text-primary"
                    >
                      {index + 1}
                    </span>
                    {StepIcon && (
                      <span
                        aria-hidden="true"
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"
                      >
                        <StepIcon className="size-5" />
                      </span>
                    )}
                  </div>
                  <CardTitle as="h3">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted">{step.body}</CardContent>
              </Card>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
