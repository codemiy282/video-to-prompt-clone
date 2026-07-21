import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback & Requests",
  description:
    "Share feedback, request features, or report bugs — the community steers what we build next.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
