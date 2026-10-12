import type { Metadata } from "next";
import { content } from "@/content";
import { EmailPreview } from "@/features/emails/components/email-preview";

export const metadata: Metadata = { title: content.admin.emails.title };

export default function EmailsPage() {
  return <EmailPreview />;
}
