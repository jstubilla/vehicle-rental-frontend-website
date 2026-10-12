"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui";
import { content } from "@/content";
import { EMAIL_PREVIEWS, type EmailPreviewId } from "@/emails/preview";
import { cn } from "@/lib/cn";

const t = content.admin.emails;

/** A row of two or three choices that act like tabs for the preview (email/plain text, desktop/phone). */
function Toggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-md border border-border-strong p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "min-h-control-sm rounded-sm px-3 text-sm font-medium",
            value === option.value ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Admin > Emails: every booking email, rendered with sample details, as the inbox would show it. */
export function EmailPreview() {
  const [selected, setSelected] = useState<EmailPreviewId>(EMAIL_PREVIEWS[0].id);
  const [view, setView] = useState<"html" | "text">("html");
  const [width, setWidth] = useState<"desktop" | "phone">("desktop");

  const preview = EMAIL_PREVIEWS.find((item) => item.id === selected)!;
  const email = useMemo(() => preview.render(), [preview]);
  const info = t.templates[selected];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1>{t.title}</h1>
        <p className="max-w-prose text-muted">{t.description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <nav aria-label={t.listLabel}>
          <ul className="flex flex-col gap-1">
            {EMAIL_PREVIEWS.map((item) => {
              const itemInfo = t.templates[item.id];
              const active = item.id === selected;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => setSelected(item.id)}
                    className={cn(
                      "flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left",
                      active ? "bg-surface-muted" : "hover:bg-surface-muted",
                    )}
                  >
                    <span className="font-medium">{itemInfo.name}</span>
                    <span className="text-sm text-muted">{itemInfo.to}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <Card as="section" aria-labelledby="email-subject" className="min-w-0 gap-0 overflow-hidden">
          <dl className="grid gap-x-4 gap-y-1 border-b border-border p-4 text-sm sm:grid-cols-[6rem_minmax(0,1fr)] md:px-6">
            <dt className="text-muted">{t.when}</dt>
            <dd>{info.when}</dd>
            <dt className="text-muted">{t.from}</dt>
            <dd className="wrap-anywhere">{content.emails.from}</dd>
            <dt className="text-muted">{t.to}</dt>
            <dd className="wrap-anywhere">{preview.to}</dd>
            <dt className="text-muted">{t.subject}</dt>
            <dd id="email-subject" className="font-medium">
              {email.subject}
            </dd>
          </dl>

          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4 md:px-6">
            <Toggle
              label={t.view}
              value={view}
              onChange={setView}
              options={[
                { value: "html", label: t.html },
                { value: "text", label: t.text },
              ]}
            />
            {view === "html" && (
              <Toggle
                label={t.width}
                value={width}
                onChange={setWidth}
                options={[
                  { value: "desktop", label: t.desktop },
                  { value: "phone", label: t.phone },
                ]}
              />
            )}
          </div>

          <div className="bg-surface-muted p-4 md:p-6">
            {view === "html" ? (
              <iframe
                // The email is shown exactly as written, isolated from the admin page's styles. No scripts
                // may run in it; same-origin only lets the browser draw it like a normal page.
                srcDoc={email.html}
                sandbox="allow-same-origin"
                title={t.frameTitle(info.name)}
                className={cn(
                  "mx-auto block h-[46rem] w-full rounded-md border border-border bg-[#f3f4f6]",
                  width === "phone" && "max-w-[375px]",
                )}
              />
            ) : (
              <pre className="overflow-x-auto rounded-md border border-border bg-card p-4 font-mono text-sm whitespace-pre-wrap">
                {email.text}
              </pre>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
