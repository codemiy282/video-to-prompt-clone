/**
 * Image to Video page with LTX-Video integration
 * 
 * Place this at: src/app/image-to-video/page.tsx
 * Replaces the existing implementation
 */

"use client";

import { useState, useRef } from "react";
import {
  IconPhoto,
  IconUpload,
  IconPlayerPlayFilled,
  IconLoader2,
  IconCopy,
  IconCheck,
  IconDownload,
  IconAlertCircle,
} from "@tabler/icons-react";

interface GenerationResponse {
  success: boolean;
  video_base64?: string;
  video_url?: string;
  error?: string;
  message?: string;
}

export default function ImageToVideo() {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [numFrames, setNumFrames] = useState(50);
  const [guidanceScale, setGuidanceScale] = useState(10.0);
  const [inferenceSteps, setInferenceSteps] = useState(50);
  const [progress, setProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  async function generateVideo() {
    if (!selectedFile || !prompt.trim()) {
      setError("Please upload an image and enter a prompt");
      return;
    }

    setGenerating(true);
    setError(null);
    setResult(null);
    setVideoBlob(null);
    setProgress("Sending request to server...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("prompt", prompt);
      formData.append("num_frames", String(numFrames));
      formData.append("guidance_scale", String(guidanceScale));
      formData.append("num_inference_steps", String(inferenceSteps));

      setProgress("Processing on backend...");

      const response = await fetch("/api/ltx-video", {
        method: "POST",
        body: formData,
      });

      const data: GenerationResponse = await response.json();

      if (!data.success) {
        let errorMsg = data.message || data.error || "Generation failed";

        // Provide helpful error messages
        if (
          data.error === "BACKEND_UNAVAILABLE" ||
          data.error?.includes("BACKEND")
        ) {
          errorMsg +=
            "\n\nStart the backend with:\npython -m uvicorn ltx_video_api:app --reload";
        }

        setError(errorMsg);
        setProgress("");
        return;
      }

      // Convert base64 to blob
      if (data.video_base64) {
        const binaryString = atob(data.video_base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "video/mp4" });
        setVideoBlob(blob);

        // Create preview URL
        const url = URL.createObjectURL(blob);
        setResult(url);
        setProgress("");
      } else {
        setError("No video data received");
        setProgress("");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";

      if (errorMsg.includes("ECONNREFUSED")) {
        setError(
          "Cannot connect to backend. Make sure it's running:\npython -m uvicorn ltx_video_api:app --reload"
        );
      } else if (errorMsg.includes("timeout")) {
        setError(
          "Generation timed out. Try reducing num_frames or inference_steps"
        );
      } else {
        setError(`Error: ${errorMsg}`);
      }

      setProgress("");
    } finally {
      setGenerating(false);
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 10 * 1024 * 1024) {
        setError("Image must be smaller than 10MB");
        return;
      }
      setSelectedFile(f);
      setError(null);
    }
    e.target.value = "";
  }

  function handleDownload() {
    if (!videoBlob) return;

    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated_video.mp4";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
              Transform static images into cinematic AI-generated videos using
              LTX-Video
            </p>
          </div>

          <div className="animate-fade-up delay-3 mx-auto mt-8 max-w-3xl">
            <div className="mx-auto w-full max-w-2xl space-y-6">
              {/* Image Upload */}
              <div className="my-6">
                <label className="block text-sm font-medium mb-2">
                  Upload Image
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelected}
                />
                <button
                  type="button"
                  disabled={generating}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-3 py-16 text-center transition-all border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/10 cursor-pointer disabled:opacity-60"
                >
                  <IconUpload className="mb-3 size-11 text-muted-foreground" />
                  <h3 className="font-semibold text-lg text-foreground">
                    {selectedFile ? selectedFile.name : "Upload your source image"}
                  </h3>
                  <p className="mx-auto max-w-md text-muted-foreground text-sm leading-7">
                    PNG, JPG, or WEBP (max 10MB)
                  </p>
                </button>
              </div>

              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Video Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the video you want to generate. E.g., 'A cinematic shot of a futuristic city at sunset with neon lights reflecting on wet streets'"
                  disabled={generating}
                  className="w-full h-24 rounded-lg border border-border bg-background p-3 text-sm text-foreground outline-none resize-none disabled:opacity-50"
                />
              </div>

              {/* Advanced Options */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-2">
                    Frames ({numFrames})
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    value={numFrames}
                    onChange={(e) => setNumFrames(parseInt(e.target.value))}
                    disabled={generating}
                    className="w-full disabled:opacity-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round((numFrames / 30) * 10) / 10}s @ 30fps
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2">
                    Guidance ({guidanceScale.toFixed(1)})
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={guidanceScale}
                    onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                    disabled={generating}
                    className="w-full disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2">
                    Steps ({inferenceSteps})
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={inferenceSteps}
                    onChange={(e) => setInferenceSteps(parseInt(e.target.value))}
                    disabled={generating}
                    className="w-full disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex gap-4 justify-center mt-6">
                <button
                  type="button"
                  disabled={!selectedFile || !prompt.trim() || generating}
                  onClick={generateVideo}
                  className="group inline-flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all h-12 px-8 hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {generating ? (
                    <IconLoader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <IconPlayerPlayFilled className="size-4 mr-2" />
                  )}
                  {generating ? "Generating..." : "Generate Video"}
                </button>
              </div>

              {/* Progress */}
              {progress && (
                <div className="mx-auto mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
                  {progress}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  <div className="flex gap-2">
                    <IconAlertCircle className="size-4 flex-shrink-0 mt-0.5" />
                    <div className="whitespace-pre-wrap">{error}</div>
                  </div>
                </div>
              )}

              {/* Video Result */}
              {result && (
                <div className="mx-auto mt-4 max-w-2xl rounded-2xl border border-border bg-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">
                      Generated Video
                    </h3>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted/50 cursor-pointer flex items-center gap-1"
                    >
                      <IconDownload className="size-3" />
                      Download
                    </button>
                  </div>

                  <video
                    ref={videoRef}
                    src={result}
                    controls
                    autoPlay
                    loop
                    muted
                    className="w-full rounded-lg bg-black"
                  />

                  <div className="text-xs text-muted-foreground">
                    <p>
                      💾 Size:{" "}
                      {videoBlob ? `${(videoBlob.size / (1024 * 1024)).toFixed(2)} MB` : "N/A"}
                    </p>
                    <p>⏱️ Duration: {Math.round((numFrames / 30) * 10) / 10}s</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
