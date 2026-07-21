import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Storyboard Generator",
  description: "Draft scene-by-scene storyboard layouts from your script or idea.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
