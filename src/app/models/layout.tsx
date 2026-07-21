import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Model Support",
  description:
    "Compare AI video model capabilities — text/image input, native audio, first/last frame, camera controls — with links to official docs.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
