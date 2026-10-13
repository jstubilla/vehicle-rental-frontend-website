import { Reveal, Section } from "@/components/ui";

/**
 * The booking steps as one route: each numeral is joined to the next by a dashed line, like a road's
 * lane marking, so the eye runs 1 → 2 → 3 → 4. Wide screens run it across in four columns; phones run
 * it down, the line dropping from each numeral to the next. On first view the numerals settle in turn and each leg of the route
 * draws after them (see .steps-leg in globals.css).
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
      <div className="flex flex-col gap-8 md:gap-12">
        <h2 id="how-it-works-heading">{title}</h2>
        <Reveal as="ol" className="grid lg:grid-cols-4">
          {steps.map((step, index) => {
            const last = index === steps.length - 1;
            return (
              <li
                key={step.title}
                data-reveal-item=""
                className="grid grid-cols-[auto_1fr] gap-x-4 lg:grid-cols-1 lg:gap-x-0 lg:gap-y-5"
              >
                {/* Numeral and the leg of the route to the next step: down on phones, across on wide screens. */}
                <div aria-hidden="true" className="flex w-12 flex-col items-center lg:w-auto lg:flex-row lg:items-center lg:gap-5">
                  <span className="font-heading text-5xl leading-none font-extrabold tracking-display text-foreground tabular-nums">
                    {index + 1}
                  </span>
                  {!last && (
                    <span className="steps-leg mt-3 mb-2 flex-1 border-l-2 border-dashed border-border-strong lg:mt-0 lg:mb-0 lg:mr-5 lg:border-t-2 lg:border-l-0" />
                  )}
                </div>
                <div className={last ? "flex flex-col gap-1 lg:pr-0" : "flex flex-col gap-1 pb-10 lg:pr-8 lg:pb-0"}>
                  <h3 className="text-lg">{step.title}</h3>
                  <p className="max-w-xs text-muted">{step.body}</p>
                </div>
              </li>
            );
          })}
        </Reveal>
      </div>
    </Section>
  );
}
