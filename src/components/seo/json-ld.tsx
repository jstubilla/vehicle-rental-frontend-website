/** Adds structured data (see lib/structured-data.ts) to a page. It is invisible to visitors. */
export function JsonLd({ data }: { data: object }) {
  // "<" is escaped so text inside the data can never close the script tag early.
  const json = JSON.stringify(data).replace(/</g, "\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
