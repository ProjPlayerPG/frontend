import type { Metadata } from "next";
import { Cormorant_Garamond, Space_Grotesk } from "next/font/google";
import SiteHeader from "@/components/siteHeader";
import "./globals.css";

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "PlayerPG",
  description: "Une bibliotheque RPG inspiree des grandes aventures fantasy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} antialiased`}
      >
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
