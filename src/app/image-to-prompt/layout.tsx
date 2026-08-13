import type { Metadata } from "next";

export const metadata: Metadata = {
  // Its own URL, so the root layout's canonical is not inherited and
  // every page stops declaring itself a duplicate of the home page.
  alternates: { canonical: "/image-to-prompt" },
  openGraph: { url: "/image-to-prompt" },
  title: "Image to Prompt",
  description: "Extract descriptive, editable AI prompts from any image.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
