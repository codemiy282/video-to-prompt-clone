import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { SITE_URL } from "@/lib/siteUrl";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Your AI video pre-production copilot. Turn any idea, clip, or image into production-ready prompts, scene breakdowns, and storyboards — so your credits go to great generations, not guesswork.";

export const metadata: Metadata = {
  // Without this, Open Graph and canonical URLs stay relative, which crawlers
  // and link unfurlers cannot resolve. Sourced from the same place as the
  // sitemap so the three can never disagree about which host is canonical.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Video to Prompt — AI Video Pre-production Copilot",
    template: "%s · Video to Prompt",
  },
  description: DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Video to Prompt",
    title: "Video to Prompt — AI Video Pre-production Copilot",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Video to Prompt — AI Video Pre-production Copilot",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
