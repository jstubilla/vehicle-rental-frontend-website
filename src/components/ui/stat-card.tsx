import Link from "next/link";
import { Card, CardContent } from "./card";

export interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  /** Makes the label a link to the related list. */
  href?: string;
}

/** A single headline number, used on the dashboard. */
export function StatCard({ label, value, hint, href }: StatCardProps) {
  return (
    <Card as="article">
      <CardContent className="flex flex-col gap-1 pt-4 md:pt-6">
        <h3 className="text-sm font-medium text-muted">
          {href ? (
            <Link href={href} className="text-inherit underline-offset-4 hover:underline">
              {label}
            </Link>
          ) : (
            label
          )}
        </h3>
        <p className="text-3xl font-semibold">{value}</p>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </CardContent>
    </Card>
  );
}
