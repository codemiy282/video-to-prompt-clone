import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prompt Validator",
  description:
    "Score your AI video prompt and get concrete, model-aware feedback before you spend render credits.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
