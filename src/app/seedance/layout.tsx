import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seedance Prompt Generator",
  description: "Craft optimized, model-ready prompts for ByteDance Seedance.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
