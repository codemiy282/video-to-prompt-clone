import type { Metadata } from "next";

export const metadata: Metadata = {
  // Its own URL, so the root layout's canonical is not inherited and
  // every page stops declaring itself a duplicate of the home page.
  alternates: { canonical: "/feedback" },
  openGraph: { url: "/feedback" },
  title: "Feedback & Requests",
  description:
    "Share feedback, request features, or report bugs — the community steers what we build next.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
