import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kling AI Prompt Generator",
  description: "Craft optimized, model-ready prompts for Kling AI video generation.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
