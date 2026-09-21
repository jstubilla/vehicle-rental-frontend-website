import type { Metadata } from "next";
import { content } from "@/content";
import { ForbiddenNotice } from "@/features/auth/components/forbidden-notice";

export const metadata: Metadata = { title: content.admin.forbidden.title };

export default function ForbiddenPage() {
  return <ForbiddenNotice />;
}
