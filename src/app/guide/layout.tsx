import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Guide",
  description:
    "How to turn an idea into model-ready prompts: a five-minute walkthrough, what each video model expects, a cinematography glossary, before-and-after prompt examples, and how to read the Validator score.",
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
