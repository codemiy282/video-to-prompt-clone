"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { IconChevronDown, IconLanguage, IconSelector, IconMenu2, IconX } from "@tabler/icons-react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [generatorsOpen, setGeneratorsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 transition-all duration-300">
      <div className="container mx-auto max-w-7xl px-4">
        <nav aria-label="Main navigation" className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link aria-label="Home" className="flex items-center gap-2 shrink-0" href="/">
            <img src="https://videotoprompt.org/logo.png" alt="Video to Prompt logo" className="size-8 rounded-md dark:hidden" width="32" height="32" />
            <img src="https://videotoprompt.org/logo-dark.png" alt="Video to Prompt logo" className="size-8 rounded-md hidden dark:block" width="32" height="32" />
            <span className="text-xl font-semibold tracking-tight text-foreground">Video to Prompt</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex lg:items-center lg:gap-8 flex-1 justify-center">
            <div className="relative">
              <button
                type="button"
                onClick={() => setGeneratorsOpen(!generatorsOpen)}
                className="group inline-flex h-9 w-max items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus:outline-none cursor-pointer text-foreground"
              >
                Prompt Generators
                <IconChevronDown className={`ml-1 size-3 transition-transform duration-200 ${generatorsOpen ? "rotate-180" : ""}`} />
              </button>
              {generatorsOpen && (
                <div className="absolute left-0 mt-2 w-48 rounded-md border border-border bg-card p-1 shadow-md z-50">
                  <Link href="/kling" className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted">Kling AI Generator</Link>
                  <Link href="/runway" className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted">Runway Generator</Link>
                  <Link href="/seedance" className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted">Seedance Generator</Link>
                  <Link href="/veo" className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted">Veo 3 Generator</Link>
                </div>
              )}
            </div>
            <Link href="/image-to-video" className="inline-flex h-9 w-max items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              Image to Video
            </Link>
            <Link href="/image-to-prompt" className="inline-flex h-9 w-max items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              Image to Prompt
            </Link>
            <Link href="/storyboard" className="inline-flex h-9 w-max items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              Storyboard
            </Link>
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <button
              type="button"
              className="flex w-fit items-center justify-between rounded-lg border border-input px-2 h-9 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer gap-1.5"
            >
              <IconLanguage className="size-4" />
              <span>en</span>
              <IconSelector className="size-4" />
            </button>
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-4">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 rounded-md border border-border text-foreground hover:bg-muted cursor-pointer"
            >
              {mobileMenuOpen ? <IconX className="size-6" /> : <IconMenu2 className="size-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-border flex flex-col gap-2">
            <div className="px-3 py-2 font-semibold text-sm text-foreground">Prompt Generators</div>
            <div className="pl-4 flex flex-col gap-1 border-l border-border ml-3">
              <Link href="/kling" className="py-2 text-sm text-muted-foreground hover:text-foreground">Kling AI Generator</Link>
              <Link href="/runway" className="py-2 text-sm text-muted-foreground hover:text-foreground">Runway Generator</Link>
              <Link href="/seedance" className="py-2 text-sm text-muted-foreground hover:text-foreground">Seedance Generator</Link>
              <Link href="/veo" className="py-2 text-sm text-muted-foreground hover:text-foreground">Veo 3 Generator</Link>
            </div>
            <Link href="/image-to-video" className="px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg">
              Image to Video
            </Link>
            <Link href="/image-to-prompt" className="px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg">
              Image to Prompt
            </Link>
            <Link href="/storyboard" className="px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg">
              Storyboard
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
