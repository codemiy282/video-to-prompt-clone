import Link from "next/link";
import { IconMailFilled } from "@tabler/icons-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background transition-colors duration-300">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-8 py-16 md:grid-cols-6">
          {/* Logo & Description */}
          <div className="col-span-full flex flex-col items-start md:col-span-2">
            <div className="flex items-center space-x-2">
              <img src="https://videotoprompt.org/logo.png" alt="Video to Prompt logo" className="size-8 rounded-md dark:hidden" width="32" height="32" />
              <img src="https://videotoprompt.org/logo-dark.png" alt="Video to Prompt logo" className="size-8 rounded-md hidden dark:block" width="32" height="32" />
              <span className="text-xl font-semibold text-foreground">Video to Prompt</span>
            </div>
            <p className="text-muted-foreground text-sm py-2 mt-2 md:pr-12 leading-relaxed">
              Unlock the full potential of your videos with our cutting-edge AI, transforming them into detailed prompts effortlessly.
            </p>
            <nav aria-label="Social links" className="flex items-center gap-4 pt-4">
              <a
                href="mailto:support@videotoprompt.org"
                target="_blank"
                rel="noreferrer"
                aria-label="Email"
                className="inline-flex size-8 items-center justify-center rounded-full border border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200"
              >
                <IconMailFilled className="size-4 text-muted-foreground hover:text-primary" />
              </a>
            </nav>
          </div>

          {/* Links Column 1: About */}
          <div className="col-span-1 md:col-span-1 flex flex-col items-start">
            <span className="text-sm font-semibold uppercase tracking-wider text-foreground">About</span>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  What Clients Say
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="mailto:support@videotoprompt.org" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Email Support
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Tools */}
          <div className="col-span-1 md:col-span-2 flex flex-col items-start">
            <span className="text-sm font-semibold uppercase tracking-wider text-foreground">Tools</span>
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Video Prompt Generator
                </Link>
              </li>
              <li>
                <Link href="/seedance" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Seedance Prompt Generator
                </Link>
              </li>
              <li>
                <Link href="/veo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Veo 3 Prompt Generator
                </Link>
              </li>
              <li>
                <Link href="/kling" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Kling AI Prompt Generator
                </Link>
              </li>
              <li>
                <Link href="/runway" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Runway Prompt Generator
                </Link>
              </li>
              <li>
                <Link href="/image-to-video" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Image to Video
                </Link>
              </li>
              <li>
                <Link href="/image-to-prompt" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Image to Prompt
                </Link>
              </li>
              <li>
                <Link href="/storyboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Storyboard Generator
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Legal */}
          <div className="col-span-1 md:col-span-1 flex flex-col items-start">
            <span className="text-sm font-semibold uppercase tracking-wider text-foreground">Legal</span>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-8">
        <div className="container mx-auto max-w-7xl px-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Video to Prompt. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
