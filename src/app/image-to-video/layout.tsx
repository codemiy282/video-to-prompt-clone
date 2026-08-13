import type { Metadata } from "next";

export const metadata: Metadata = {
  // Its own URL, so the root layout's canonical is not inherited and
  // every page stops declaring itself a duplicate of the home page.
  alternates: { canonical: "/image-to-video" },
  openGraph: { url: "/image-to-video" },
  title: "Image to Video",
  description:
    "Turn a still image into a reference motion preview to plan your shot before you generate.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
