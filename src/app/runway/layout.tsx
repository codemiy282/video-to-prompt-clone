import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Runway Prompt Generator",
  description: "Craft optimized, model-ready prompts for the latest Runway video models.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
