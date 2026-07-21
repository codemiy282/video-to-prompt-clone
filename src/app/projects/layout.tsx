import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Carry one idea from concept to model-ready prompts: break it into scenes, generate a prompt per scene, save locally, and export your production sheet.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
