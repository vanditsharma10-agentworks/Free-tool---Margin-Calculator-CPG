import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

import { siteConfig } from "@/config/site";
import { SiteLayout } from "@/components/layout";
import { OrganizationJsonLd } from "@/components/seo/organization-jsonld";

// Same font wiring as the main site: one variable-weight Montserrat family,
// exposed as --font-montserrat (tokens.css maps sans/mono/heading onto it).
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico", apple: "/icon.png" },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    url: siteConfig.url,
    title: siteConfig.og.title,
    description: siteConfig.og.description,
    locale: "en_US",
    images: [
      { url: siteConfig.og.image, width: 1200, height: 630, alt: siteConfig.og.imageAlt },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.og.title,
    description: siteConfig.og.description,
    images: [siteConfig.og.image],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <OrganizationJsonLd />
        <SiteLayout>{children}</SiteLayout>
      </body>
    </html>
  );
}
