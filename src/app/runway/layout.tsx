import type { Metadata } from "next";

export const metadata: Metadata = {
  // Its own URL, so the root layout's canonical is not inherited and
  // every page stops declaring itself a duplicate of the home page.
  alternates: { canonical: "/runway" },
  openGraph: { url: "/runway" },
  title: "Runway Prompt Generator",
  description: "Craft optimized, model-ready prompts for the latest Runway video models.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
