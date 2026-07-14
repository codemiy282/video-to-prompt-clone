"use client";

import { useState } from "react";
import { IconMovie, IconArrowLeft, IconLoader2, IconCopy, IconCheck } from "@tabler/icons-react";
import Link from "next/link";

export default function KlingGenerator() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("text", text.trim());
      fd.append("platform", "kling");
      const res = await fetch("/api/generate-prompt", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) setResult(data.prompt);
      else setError(data.error?.message || "Request failed.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
              <IconMovie className="size-6" />
            </span>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Kling AI Prompt Generator</h1>
              <p className="text-muted-foreground mt-1">Optimize prompts for Kling AI video generation model.</p>
            </div>
          </div>
          <div className="mt-8 border border-border rounded-xl p-6 bg-card">
            <h3 className="font-semibold text-lg mb-4 text-foreground">Enter video description or idea</h3>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="E.g., A futuristic cyberpunk street scene with neon signs, pouring rain, and a robot walking in slow motion..."
              className="w-full h-32 rounded-lg bg-transparent border-2 border-border p-3 text-sm focus:border-primary text-foreground resize-none outline-none"
            />
            <button
              type="button"
              disabled={!text.trim() || loading}
              onClick={handleGenerate}
              className="mt-4 w-full bg-primary text-primary-foreground font-medium text-sm transition-all h-12 rounded-lg hover:opacity-90 disabled:opacity-50 cursor-pointer inline-flex items-center justify-center"
            >
              {loading ? <IconLoader2 className="size-4 mr-2 animate-spin" /> : null}
              {loading ? "Generating..." : "Generate Kling Prompt"}
            </button>
          </div>
          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-red-600 dark:text-red-400">
              <p className="font-medium">Error</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          )}
          {result && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-foreground">Generated Kling Prompt</h3>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  {copied ? <><IconCheck className="size-4 text-green-500" /> Copied</> : <><IconCopy className="size-4" /> Copy</>}
                </button>
              </div>
              <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{result}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
