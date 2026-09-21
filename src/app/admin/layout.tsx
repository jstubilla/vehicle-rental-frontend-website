import type { Metadata } from "next";
import { content } from "@/content";

// The admin area is private, so it is kept out of search results.
export const metadata: Metadata = {
  title: { template: content.admin.meta.titleTemplate, default: content.admin.frame.brand },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
