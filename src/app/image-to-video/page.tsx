"use client";

import { IconPhoto, IconUpload, IconPlayerPlayFilled } from "@tabler/icons-react";

export default function ImageToVideo() {
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
                <button
                  type="button"
                  className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-3 py-16 text-center transition-all border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/10 cursor-pointer"
                >
                  <IconUpload className="mb-3 size-11 text-muted-foreground" />
                  <h3 className="font-semibold text-lg text-foreground">Upload your source image</h3>
                  <p className="mx-auto max-w-md text-muted-foreground text-sm leading-7">
                    Upload PNG, JPG, or WEBP image to animate with AI
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
                  Generate Video
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
