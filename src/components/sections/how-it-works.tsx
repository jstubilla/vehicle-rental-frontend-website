import { Section } from "@/components/ui";

export function HowItWorks({
  title,
  steps,
}: {
  title: string;
  steps: readonly { title: string; body: string }[];
}) {
  return (
    <Section variant="muted" aria-labelledby="how-it-works-heading">
      <h2 id="how-it-works-heading" className="mb-8">
        {title}
      </h2>
      <ol className="flex flex-col gap-8 sm:flex-row sm:gap-4">
        {steps.map((step, index) => (
          <li key={step.title} className="relative flex flex-1 flex-col items-center gap-3 text-center">
            {index > 0 && (
              <span aria-hidden="true" className="absolute top-5 right-1/2 hidden h-px w-full bg-border sm:block" />
            )}
            <span
              aria-hidden="true"
              className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
            >
              {index + 1}
            </span>
            <div className="flex flex-col gap-1">
              <h3>{step.title}</h3>
              <p className="text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
