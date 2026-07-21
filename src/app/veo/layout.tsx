import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Veo 3 Prompt Generator",
  description: "Craft optimized Veo 3 prompts with synchronized audio, dialogue, and music cues.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
