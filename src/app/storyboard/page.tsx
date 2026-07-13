"use client";

import { IconUpload, IconPlayerPlayFilled, IconLayoutGrid } from "@tabler/icons-react";

export default function Storyboard() {
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
                  placeholder="Describe your story or script here..."
                  className="w-full h-32 rounded-lg bg-transparent border-2 border-border p-3 text-sm focus:border-primary text-foreground resize-none outline-none"
                />
              </div>

              <div className="flex justify-center mt-6">
                <button
                  type="button"
                  className="group inline-flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all h-12 px-8 hover:opacity-90 cursor-pointer"
                >
                  <IconLayoutGrid className="size-4 mr-2" />
                  Generate Storyboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
