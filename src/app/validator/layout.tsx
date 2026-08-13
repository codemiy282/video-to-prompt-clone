import type { Metadata } from "next";

export const metadata: Metadata = {
  // Its own URL, so the root layout's canonical is not inherited and
  // every page stops declaring itself a duplicate of the home page.
  alternates: { canonical: "/validator" },
  openGraph: { url: "/validator" },
  title: "Prompt Validator",
  description:
    "Score your AI video prompt and get concrete, model-aware feedback before you spend render credits.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
