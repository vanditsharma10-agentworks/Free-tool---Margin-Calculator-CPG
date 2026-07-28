import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CPG Retail Margin Calculator — Agentworks",
  description:
    "Channel-aware CPG cost-to-shelf margin calculator: COGS to shelf price across distributor and retailer, with real by-channel presets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
