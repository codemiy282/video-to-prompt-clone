import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image to Video",
  description:
    "Turn a still image into a reference motion preview to plan your shot before you generate.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
