import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/blog" },
  openGraph: { url: "/blog" },
  // A plain string here would break the template chain for child segments, so
  // individual posts would render without the "· Video to Prompt" suffix that
  // every other page carries. Re-declaring the template keeps posts branded.
  title: {
    default: "Blog",
    template: "%s · Video to Prompt",
  },
  description:
    "Guides and notes on planning AI video: keeping characters consistent across shots, writing prompts each model actually follows, and spending render credits well.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
