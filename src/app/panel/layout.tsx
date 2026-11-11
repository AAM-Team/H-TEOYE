import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Panel institucional", template: "%s · Panel H-TEOYE" },
  robots: { index: false, follow: false },
};

export default function PanelRaizLayout({ children }: { children: React.ReactNode }) {
  return <div className="theme-panel flex min-h-full flex-1 flex-col">{children}</div>;
}
