import type { Metadata } from "next";
import { LegalDocument } from "@/components/sections/legal-document";
import { content } from "@/content";
import { buildMetadata } from "@/lib/seo";

const t = content.legal.privacy;

export const metadata: Metadata = buildMetadata({ ...t.meta, path: "/privacy" });

export default function PrivacyPage() {
  return <LegalDocument title={t.title} subtitle={t.subtitle} sections={t.sections} />;
}
