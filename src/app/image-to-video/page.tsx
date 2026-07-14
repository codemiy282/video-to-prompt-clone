"use client";

import { useState, useRef } from "react";
import { IconPhoto, IconUpload, IconPlayerPlayFilled, IconLoader2, IconCopy, IconCheck } from "@tabler/icons-react";

export default function ImageToVideo() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function postPrompt(body: FormData) {
    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch("/api/generate-prompt", { method: "POST", body });
      const data = await res.json();
      if (data.success) setResult(data.prompt);
      else setError(data.error?.message || "Request failed.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setSelectedFile(f);
    e.target.value = "";
  }

  function handleGenerate() {
    if (!selectedFile) return;
    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("type", "image");
    void postPrompt(fd);
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
              Image to Video
            </h1>
            <p className="animate-fade-up delay-2 mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              Transform static images into cinematic AI-generated videos.
            </p>
          </div>

          <div className="animate-fade-up delay-3 mx-auto mt-8 max-w-3xl">
            <div className="mx-auto w-full max-w-2xl">
              <div className="my-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelected}
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-3 py-16 text-center transition-all border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/10 cursor-pointer disabled:opacity-60"
                >
                  <IconUpload className="mb-3 size-11 text-muted-foreground" />
                  <h3 className="font-semibold text-lg text-foreground">
                    {selectedFile ? selectedFile.name : "Upload your source image"}
                  </h3>
                  <p className="mx-auto max-w-md text-muted-foreground text-sm leading-7">
                    Upload PNG, JPG, or WEBP image to generate a video prompt
                  </p>
                </button>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  type="button"
                  disabled={!selectedFile || loading}
                  onClick={handleGenerate}
                  className="group inline-flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all h-12 px-8 hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <IconLoader2 className="size-4 mr-2 animate-spin" /> : <IconPlayerPlayFilled className="size-4 mr-2" />}
                  {loading ? "Analyzing..." : "Generate Video Prompt"}
                </button>
              </div>
            </div>

            {loading && (
              <div className="mx-auto mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
                Generating your prompt...
              </div>
            )}
            {error && (
              <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            {result && (
              <div className="mx-auto mt-4 max-w-2xl rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Generated Video Prompt</h3>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted/50 cursor-pointer"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={result}
                  className="h-40 w-full resize-none rounded-lg border border-border bg-background p-3 text-sm text-foreground outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
