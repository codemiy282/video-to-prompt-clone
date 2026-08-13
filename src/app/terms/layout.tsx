import type { Metadata } from "next";

export const metadata: Metadata = {
  // Its own URL, so the root layout's canonical is not inherited and
  // every page stops declaring itself a duplicate of the home page.
  alternates: { canonical: "/terms" },
  openGraph: { url: "/terms" },
  title: "Terms of Service",
  description: "The terms governing your use of Video to Prompt.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
