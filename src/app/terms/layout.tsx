import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of Video to Prompt.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
