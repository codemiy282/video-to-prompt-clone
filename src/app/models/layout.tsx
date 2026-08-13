import type { Metadata } from "next";

export const metadata: Metadata = {
  // Its own URL, so the root layout's canonical is not inherited and
  // every page stops declaring itself a duplicate of the home page.
  alternates: { canonical: "/models" },
  openGraph: { url: "/models" },
  title: "Model Support",
  description:
    "Compare AI video model capabilities — text/image input, native audio, first/last frame, camera controls — with links to official docs.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
