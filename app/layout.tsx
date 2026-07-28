import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { montserrat, plexMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Retail Price & Margin Calculator — Agentworks",
  description:
    "Work out what your product needs to sell for on the shelf, and what it costs to get there — with real figures from 219 US retail chains.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${montserrat.variable} ${plexMono.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
