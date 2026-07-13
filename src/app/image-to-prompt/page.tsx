"use client";

import { useState } from "react";
import Link from "next/link";
import { IconPhoto, IconVideo, IconUpload, IconPlayerPlayFilled } from "@tabler/icons-react";

export default function ImageToPrompt() {
  const [activeTab, setActiveTab] = useState<"video" | "image">("image");

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <section className="relative overflow-hidden pt-12 pb-16">
        <div aria-hidden="true" className="absolute inset-0 isolate hidden opacity-40 dark:opacity-60 contain-strict lg:block pointer-events-none">
          <div className="w-[35rem] h-[80rem] -translate-y-[22rem] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,oklch(0.85_0.06_262/.14)_0,oklch(0.7_0.04_262/.05)_50%,transparent_80%)]"></div>
        </div>

        <div className="container mx-auto max-w-7xl px-6 relative z-10">
          <div className="text-center sm:mx-auto">
            <h1 className="animate-fade-up delay-1 text-balance font-bold text-4xl text-foreground sm:text-5xl md:text-6xl xl:text-7xl">
              Image to Prompt
            </h1>
            <p className="animate-fade-up delay-2 mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              Extract descriptive AI prompts from any image.
            </p>
          </div>

          <div className="animate-fade-up delay-3 mx-auto mt-8 max-w-3xl">
            {/* Tabs */}
            <div className="mx-auto mb-6 flex w-fit items-center rounded-full border border-border bg-muted/50 p-1">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all text-muted-foreground hover:text-foreground"
              >
                <IconVideo className="h-4 w-4" />
                Video to Prompt
              </Link>
              <button
                onClick={() => setActiveTab("image")}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
                  activeTab === "image"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <IconPhoto className="h-4 w-4" />
                Image to Prompt
              </button>
            </div>

            {/* Input Box */}
            <div className="mx-auto w-full max-w-2xl">
              {/* Upload Drag & Drop */}
              <div className="my-6">
                <button
                  type="button"
                  className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-3 py-16 text-center transition-all border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/10 cursor-pointer"
                >
                  <IconUpload className="mb-3 size-11 text-muted-foreground" />
                  <h3 className="font-semibold text-lg text-foreground">Upload your image</h3>
                  <p className="mx-auto max-w-md text-muted-foreground text-sm leading-7">
                    Supports JPG, PNG, WEBP, and GIF files up to 10 MB
                  </p>
                </button>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  type="button"
                  disabled
                  className="group inline-flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all h-12 px-8 hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  <IconPlayerPlayFilled className="size-4 mr-2" />
                  Extract Prompt
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
