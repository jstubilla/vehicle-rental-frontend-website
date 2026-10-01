import { Reveal, Section } from "@/components/ui";

/**
 * The booking steps as one strip: a large numeral, a title and a line each. On wide screens a rule runs
 * across the top like a route, with a stop at each step; it draws itself in once, the first time the
 * strip scrolls into view (see .steps-route in globals.css).
 */
export function HowItWorks({
  title,
  steps,
}: {
  title: string;
  steps: readonly { title: string; body: string }[];
}) {
  return (
    <Section variant="ruled" aria-labelledby="how-it-works-heading">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <h2 id="how-it-works-heading" className="lg:col-span-3">
          {title}
        </h2>
        <Reveal as="ol" className="relative grid gap-x-8 gap-y-6 sm:gap-y-10 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-4">
          <span aria-hidden="true" className="steps-route absolute inset-x-0 top-0 hidden border-t border-border-strong lg:block" />
          {steps.map((step, index) => (
            <li key={step.title} data-reveal-item="" className="relative flex gap-4 sm:flex-col sm:gap-2 lg:pt-8">
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 hidden size-2.5 -translate-y-1/2 rounded-full border-2 border-border-strong bg-surface lg:block"
              />
              <span
                aria-hidden="true"
                className="w-8 shrink-0 font-heading text-4xl leading-none font-extrabold tracking-display text-foreground/20 tabular-nums sm:w-auto sm:text-5xl"
              >
                {index + 1}
              </span>
              <div className="flex flex-col gap-1 sm:mt-2">
                <h3 className="text-lg">{step.title}</h3>
                <p className="text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </Reveal>
      </div>
    </Section>
  );
}
