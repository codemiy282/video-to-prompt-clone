"use client";

import { IconVideo, IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";

export default function SeedanceGenerator() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <section className="relative overflow-hidden pt-12 pb-16">
        <div className="container mx-auto max-w-4xl px-6 relative z-10">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
            <IconArrowLeft className="size-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-6">
            <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconVideo className="size-6" />
            </span>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Seedance Prompt Generator</h1>
              <p className="text-muted-foreground mt-1">Optimize prompts for ByteDance Seedance video generator.</p>
            </div>
          </div>
          <div className="mt-8 border border-border rounded-xl p-6 bg-card">
            <h3 className="font-semibold text-lg mb-4 text-foreground">Enter video description or idea</h3>
            <textarea
              placeholder="E.g., cinematic drone shot of coastal cliffs, waves crashing on rocks, high dynamic range..."
              className="w-full h-32 rounded-lg bg-transparent border-2 border-border p-3 text-sm focus:border-primary text-foreground resize-none outline-none"
            />
            <button
              type="button"
              className="mt-4 w-full bg-primary text-primary-foreground font-medium text-sm transition-all h-12 rounded-lg hover:opacity-90 cursor-pointer"
            >
              Generate Seedance Prompt
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
