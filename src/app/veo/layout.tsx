import type { Metadata } from "next";

export const metadata: Metadata = {
  // Its own URL, so the root layout's canonical is not inherited and
  // every page stops declaring itself a duplicate of the home page.
  alternates: { canonical: "/veo" },
  openGraph: { url: "/veo" },
  title: "Veo 3 Prompt Generator",
  description: "Craft optimized Veo 3 prompts with synchronized audio, dialogue, and music cues.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
