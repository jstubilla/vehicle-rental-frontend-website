import { Card, CardContent, Media, Section } from "@/components/ui";

export function Testimonials({
  title,
  description,
  items,
}: {
  title: string;
  description?: string;
  items: readonly { quote: string; name: string; detail: string }[];
}) {
  return (
    <Section aria-labelledby="testimonials-heading">
      <div className="mb-6 flex flex-col gap-2">
        <h2 id="testimonials-heading">{title}</h2>
        {description && <p className="text-muted">{description}</p>}
      </div>
      <ul className="grid gap-4 md:grid-cols-3">
        {items.map((item, index) => (
          <li key={index}>
            <Card as="figure" className="h-full">
              <CardContent className="flex h-full flex-col gap-4 pt-4 md:pt-6">
                <blockquote className="flex-1">{item.quote}</blockquote>
                <figcaption className="flex items-center gap-3">
                  <div className="w-12 shrink-0">
                    <Media asset="avatar" className="rounded-full" sizes="3rem" />
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted">{item.detail}</p>
                  </div>
                </figcaption>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}
