import type { Metadata } from "next";

export const metadata: Metadata = {
  // Its own URL, so the root layout's canonical is not inherited and
  // every page stops declaring itself a duplicate of the home page.
  alternates: { canonical: "/prompt-converter" },
  openGraph: { url: "/prompt-converter" },
  title: "Prompt Converter",
  description:
    "Write one idea, compile it into model-specific prompts for Kling, Veo, Runway, and Seedance — with capability-aware warnings.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
