import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Video to Prompt handles your uploads and data — retention, AI provider disclosure, and your rights.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
