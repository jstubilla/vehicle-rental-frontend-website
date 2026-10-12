import { content } from "@/content";
import { SITE_URL } from "@/lib/site";

/**
 * The frame every email shares: logo header, one message, one button, footer.
 *
 * Email apps (Gmail, Outlook, Apple Mail) ignore most modern CSS, so this is deliberately
 * old-fashioned: tables for layout, inline styles, web-safe fonts, and a fixed light look.
 * Keep it that way when editing; test changes in a real inbox before relying on them.
 */

/** What every email is turned into: ready to hand to any email service (Resend, Postmark, SES…). */
export interface RenderedEmail {
  subject: string;
  html: string;
  /** Plain-text copy for email apps that do not show HTML, and to help avoid spam filters. */
  text: string;
}

const COLORS = {
  page: "#f3f4f6",
  card: "#ffffff",
  header: "#0b1120",
  heading: "#0b1120",
  body: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",
  panel: "#f3f4f6",
  button: "#fb7b29",
  buttonText: "#1f1300",
  price: "#c2410c",
  notice: "#fef3c7",
  noticeText: "#78350f",
} as const;

const FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Escapes text from the booking (names, reasons…) so it can never break or inject into the HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** A label/value list (the booking summary). The last row can be shown as the total. */
export interface SummaryRow {
  label: string;
  value: string;
  /** A second, smaller line under the value (e.g. the pick-up address). */
  detail?: string;
  emphasis?: boolean;
}

export interface EmailParts {
  subject: string;
  /** The grey line many inboxes show after the subject. */
  preheader: string;
  heading: string;
  greeting?: string;
  /** Paragraphs before the summary. */
  intro: string[];
  /** A highlighted box (e.g. the reason photos were rejected). */
  notice?: { title: string; body: string };
  summary?: SummaryRow[];
  /** Paragraphs after the summary, before the button. */
  outro?: string[];
  button?: { label: string; url: string };
  /** Small print under the button. */
  footnote?: string;
}

const paragraph = (text: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${COLORS.body};">${escapeHtml(text)}</p>`;

function summaryTable(rows: SummaryRow[]): string {
  const cells = rows
    .map((row) => {
      const top = row.emphasis ? `border-top:1px solid ${COLORS.border};padding-top:10px;` : "";
      const weight = row.emphasis ? "font-weight:bold;" : "";
      const valueColor = row.emphasis ? COLORS.price : COLORS.body;
      return `<tr>
<td valign="top" style="padding:4px 0;${top}font-size:14px;white-space:nowrap;color:${row.emphasis ? COLORS.body : COLORS.muted};${weight}">${escapeHtml(row.label)}</td>
<td align="right" style="padding:4px 0 4px 12px;${top}font-size:14px;color:${valueColor};${weight}">${escapeHtml(row.value)}${
        row.detail ? `<br><span style="font-size:13px;color:${COLORS.muted};">${escapeHtml(row.detail)}</span>` : ""
      }</td>
</tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.panel};border-radius:8px;margin:0 0 20px;">
<tr><td style="padding:14px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cells}</table></td></tr>
</table>`;
}

function noticeBox(notice: NonNullable<EmailParts["notice"]>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.notice};border-radius:8px;margin:0 0 20px;">
<tr><td style="padding:14px 16px;font-size:14px;line-height:1.5;color:${COLORS.noticeText};">
<p style="margin:0 0 4px;font-weight:bold;">${escapeHtml(notice.title)}</p>
<p style="margin:0;white-space:pre-wrap;">${escapeHtml(notice.body)}</p>
</td></tr>
</table>`;
}

/** A button made of a padded link, which works in every email app (including Outlook). */
function button({ label, url }: NonNullable<EmailParts["button"]>): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:4px auto 20px;">
<tr><td style="background:${COLORS.button};border-radius:8px;">
<a href="${escapeHtml(url)}" style="display:inline-block;padding:13px 32px;font-family:${FONT};font-size:16px;font-weight:bold;color:${COLORS.buttonText};text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a>
</td></tr>
</table>`;
}

export function renderEmail(parts: EmailParts): RenderedEmail {
  const t = content.emails;
  const logoUrl = `${SITE_URL}/images/logo-dark.png`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${escapeHtml(parts.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};font-family:${FONT};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(parts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.page};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${COLORS.card};border-radius:12px;overflow:hidden;">
<tr><td style="background:${COLORS.header};padding:18px 24px;">
<img src="${logoUrl}" width="140" alt="${escapeHtml(content.site.name)}" style="display:block;width:140px;height:auto;border:0;">
</td></tr>
<tr><td style="padding:28px 24px 8px;">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${COLORS.heading};">${escapeHtml(parts.heading)}</h1>
${parts.greeting ? paragraph(parts.greeting) : ""}
${parts.intro.map(paragraph).join("")}
${parts.notice ? noticeBox(parts.notice) : ""}
${parts.summary ? summaryTable(parts.summary) : ""}
${(parts.outro ?? []).map(paragraph).join("")}
${parts.button ? button(parts.button) : ""}
${parts.footnote ? `<p style="margin:0 0 20px;font-size:13px;line-height:1.5;color:${COLORS.muted};">${escapeHtml(parts.footnote)}</p>` : ""}
</td></tr>
<tr><td style="background:${COLORS.panel};padding:16px 24px;font-size:12px;line-height:1.5;color:${COLORS.muted};">
<p style="margin:0 0 4px;">${escapeHtml(t.footer(content.site.contactPhone))}</p>
<p style="margin:0;">${escapeHtml(t.footerNote)}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    parts.heading,
    "",
    ...(parts.greeting ? [parts.greeting, ""] : []),
    ...parts.intro.flatMap((line) => [line, ""]),
    ...(parts.notice ? [`${parts.notice.title}:`, parts.notice.body, ""] : []),
    ...(parts.summary
      ? [...parts.summary.map((row) => `${row.label}: ${row.value}${row.detail ? `, ${row.detail}` : ""}`), ""]
      : []),
    ...(parts.outro ?? []).flatMap((line) => [line, ""]),
    ...(parts.button ? [`${parts.button.label}: ${parts.button.url}`, ""] : []),
    ...(parts.footnote ? [parts.footnote, ""] : []),
    "--",
    t.footer(content.site.contactPhone),
  ].join("\n");

  return { subject: parts.subject, html, text };
}
