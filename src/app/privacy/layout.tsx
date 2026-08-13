import type { Metadata } from "next";

export const metadata: Metadata = {
  // Its own URL, so the root layout's canonical is not inherited and
  // every page stops declaring itself a duplicate of the home page.
  alternates: { canonical: "/privacy" },
  openGraph: { url: "/privacy" },
  title: "Privacy Policy",
  description:
    "How Video to Prompt handles your uploads and data — retention, AI provider disclosure, and your rights.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
