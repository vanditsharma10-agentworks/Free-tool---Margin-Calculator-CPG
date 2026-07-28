import { IBM_Plex_Mono, Montserrat } from "next/font/google";

// Shared font instances so _app AND _document use the SAME ones. The variable
// classes go on <body> in _document — that's the portal root, so dropdowns,
// toasts, and any other portal-rendered UI inherit the theme font (Montserrat)
// instead of falling back to the system font.

// Headings + body — geometric sans.
export const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

// Data / mono.
export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});
