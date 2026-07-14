"use client";

import { useState } from "react";
import { IconLayoutGrid, IconLoader2, IconCopy, IconCheck } from "@tabler/icons-react";

export default function Storyboard() {
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
        <div className="container mx-auto max-w-7xl px-6 relative z-10">
          <div className="text-center sm:mx-auto">
            <h1 className="animate-fade-up delay-1 text-balance font-bold text-4xl text-foreground sm:text-5xl md:text-6xl xl:text-7xl">
              Storyboard Generator
            </h1>
            <p className="animate-fade-up delay-2 mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              Automatically draft scene-by-scene storyboard layouts from your prompt.
            </p>
          </div>

          <div className="animate-fade-up delay-3 mx-auto mt-8 max-w-3xl">
            <div className="mx-auto w-full max-w-2xl">
              <div className="my-6">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Describe your story or script here..."
                  className="w-full h-32 rounded-lg bg-transparent border-2 border-border p-3 text-sm focus:border-primary text-foreground resize-none outline-none"
                />
              </div>

              <div className="flex justify-center mt-6">
                <button
                  type="button"
                  disabled={!text.trim() || loading}
                  onClick={handleGenerate}
                  className="group inline-flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all h-12 px-8 hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <IconLoader2 className="size-4 mr-2 animate-spin" /> : <IconLayoutGrid className="size-4 mr-2" />}
                  {loading ? "Generating..." : "Generate Storyboard"}
                </button>
              </div>
            </div>

            {error && (
              <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-red-600 dark:text-red-400">
                <p className="font-medium">Error</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            )}
            {result && (
              <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-foreground">Storyboard</h3>
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
        </div>
      </section>
    </div>
  );
}
