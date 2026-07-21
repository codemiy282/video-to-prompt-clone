import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prompt Converter",
  description:
    "Write one idea, compile it into model-specific prompts for Kling, Veo, Runway, and Seedance — with capability-aware warnings.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
