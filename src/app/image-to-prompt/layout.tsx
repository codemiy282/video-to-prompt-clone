import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image to Prompt",
  description: "Extract descriptive, editable AI prompts from any image.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
