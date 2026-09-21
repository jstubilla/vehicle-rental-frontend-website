import { AdminFrame } from "@/components/layout/admin-frame";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminFrame>{children}</AdminFrame>;
}
