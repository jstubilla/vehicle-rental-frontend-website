import { NewTabLink } from "@/components/ui";
import { content } from "@/content";

/** A short line under a form that collects personal details, linking to the Privacy Policy in a new tab. */
export function PrivacyNote({ className }: { className?: string }) {
  const t = content.legal.privacyNote;
  return (
    <p className={className ?? "text-sm text-muted"}>
      {t.lead} <NewTabLink href="/privacy">{t.link}</NewTabLink>.
    </p>
  );
}
