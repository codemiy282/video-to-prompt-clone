import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Video to Prompt — Turn Any Video Into Instant AI Prompts",
  description: "Video to Prompt turns your video uploads into detailed, accurate AI prompts and text descriptions — ready for AI image and video generation.",
  openGraph: {
    type: "website",
    siteName: "Video to Prompt",
    title: "Video to Prompt — Turn Any Video Into Instant AI Prompts",
    description: "Video to Prompt turns your video uploads into detailed, accurate AI prompts and text descriptions — ready for AI image and video generation.",
  }
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
        <Header />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
