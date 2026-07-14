"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  IconVideo,
  IconPhoto,
  IconLink,
  IconPlayerPlayFilled,
  IconUpload,
  IconWorld,
  IconShieldCheck,
  IconBolt,
  IconMessage2,
  IconLock,
  IconZoomScan,
  IconStopwatch,
  IconBulb,
  IconRobot,
  IconMovie,
  IconSparkles,
  IconCpu,
  IconArrowRight,
  IconChevronDown,
} from "@tabler/icons-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"video" | "image">("video");
  const [videoUrl, setVideoUrl] = useState("");
  const [activeAccordion, setActiveAccordion] = useState<string | null>("time-saving");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function postPrompt(body: FormData) {
    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch("/api/generate-prompt", { method: "POST", body });
      const data = await res.json();
      if (data.success) {
        setResult(data.prompt);
      } else {
        setError(data.error?.message || "Request failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleUrlSubmit() {
    const fd = new FormData();
    fd.append("type", "video");
    fd.append("url", videoUrl);
    void postPrompt(fd);
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append("file", f);
    fd.append("type", activeTab);
    void postPrompt(fd);
    e.target.value = "";
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable; ignore.
    }
  }

  const benefits = [
    {
      id: "time-saving",
      title: "Time-saving Efficiency",
      icon: <IconBolt className="size-4" />,
      content: "Quickly generates detailed prompts from video content, saving significant time.",
    },
    {
      id: "global",
      title: "Global Accessibility",
      icon: <IconWorld className="size-4" />,
      content: "Translate and target videos across multiple languages, breaking communication barriers.",
    },
    {
      id: "insights",
      title: "Interactive AI Insights",
      icon: <IconMessage2 className="size-4" />,
      content: "Refine prompts through conversational guidance to get exactly what you want.",
    },
  ];

  const faqs = [
    {
      question: "What video formats are supported?",
      answer: "We support MP4, MPEG/MPG, AVI, FLV, WEBM, WMV, 3GPP, and MOV files up to 20 MB in size.",
    },
    {
      question: "Is my data safe?",
      answer: "Yes, security is our top priority. Your video files are processed securely and deleted immediately after analysis.",
    },
    {
      question: "Does this tool support multiple languages?",
      answer: "Absolutely! We support video analysis in over 15 languages, enabling you to generate prompts in your preferred language.",
    },
    {
      question: "How long does it take to process a video?",
      answer: "The average processing time is under 10 seconds, depending on the file size and network connection.",
    },
    {
      question: "Do I need to provide credit card details to use this service?",
      answer: "No, our core service is completely free to use. You do not need to register a credit card to get started.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden pt-12 pb-16">
        {/* Background Gradients */}
        <div aria-hidden="true" className="absolute inset-0 isolate hidden opacity-40 dark:opacity-60 contain-strict lg:block pointer-events-none">
          <div className="w-[35rem] h-[80rem] -translate-y-[22rem] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,oklch(0.85_0.06_262/.14)_0,oklch(0.7_0.04_262/.05)_50%,transparent_80%)]"></div>
          <div className="h-[80rem] absolute left-0 top-0 w-[15rem] -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,oklch(0.88_0.07_262/.12)_0,oklch(0.6_0.04_262/.04)_80%,transparent_100%)] translate-x-[5%] -translate-y-[50%]"></div>
        </div>

        <div className="container mx-auto max-w-7xl px-6 relative z-10">
          <div className="text-center sm:mx-auto">
            <h1 className="animate-fade-up delay-1 text-balance font-bold text-4xl text-foreground sm:text-5xl md:text-6xl xl:text-7xl">
              Video to Prompt
            </h1>
            <p className="animate-fade-up delay-2 mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              Turn every clip into instant AI prompts.
            </p>
          </div>

          <div className="animate-fade-up delay-3 mx-auto mt-8 max-w-3xl">
            {/* Tabs */}
            <div className="mx-auto mb-6 flex w-fit items-center rounded-full border border-border bg-muted/50 p-1">
              <button
                onClick={() => setActiveTab("video")}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
                  activeTab === "video"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <IconVideo className="h-4 w-4" />
                Video to Prompt
              </button>
              <Link
                href="/image-to-prompt"
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all text-muted-foreground hover:text-foreground"
              >
                <IconPhoto className="h-4 w-4" />
                Image to Prompt
              </Link>
            </div>

            {/* Input Box */}
            <div className="mx-auto w-full max-w-2xl">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <IconLink className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/shorts/..."
                    className="h-12 w-full rounded-lg bg-transparent px-3 py-1 outline-none text-sm border-2 border-primary/40 focus:border-primary pl-10 text-foreground"
                  />
                </div>
                <button
                  type="button"
                  disabled={!videoUrl || loading}
                  onClick={handleUrlSubmit}
                  className="group inline-flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all outline-none h-12 px-6 hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  <IconPlayerPlayFilled className="size-4 mr-2" />
                  Get Prompt
                </button>
              </div>

              {/* Upload Drag & Drop */}
              <div className="my-6">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-3 py-12 text-center transition-all border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/10 cursor-pointer disabled:opacity-60"
                >
                  <IconUpload className="mb-3 size-11 text-muted-foreground" />
                  <h3 className="font-semibold text-lg text-foreground">
                    {loading ? "Analyzing…" : "Or upload a video file"}
                  </h3>
                  <p className="mx-auto max-w-md text-muted-foreground text-sm leading-7">
                    Supports MP4, MPEG/MPG, AVI, FLV, WEBM, WMV, 3GPP, and MOV files up to 20 MB
                  </p>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,image/*"
                  className="hidden"
                  onChange={handleFileSelected}
                />
              </div>

              {loading && (
                <div className="mx-auto mb-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
                  Generating your prompt…
                </div>
              )}

              {error && (
                <div className="mx-auto mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              {result && (
                <div className="mx-auto mb-4 rounded-2xl border border-border bg-card p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Generated Prompt</h3>
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
        </div>
      </section>

      {/* Introduce Section */}
      <section id="introduce" className="px-4 py-16 md:py-24 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="overflow-hidden rounded-2xl border border-border bg-muted/30">
              <img
                src="/imgs/features/feature-1.png"
                alt="What is Video to Prompt"
                className="w-full h-auto object-cover min-h-[300px]"
              />
            </div>
            <div>
              <h2 className="text-balance font-bold text-3xl sm:text-4xl text-foreground">What is Video to Prompt</h2>
              <p className="mt-4 text-pretty text-muted-foreground leading-relaxed">
                Video to Prompt transforms your video uploads into detailed, accurate text descriptions using AI technology.
              </p>
              <ul className="mt-8 space-y-6">
                <li className="flex items-start gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                    <IconPlayerPlayFilled className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">Video Analysis</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Generate detailed descriptions automatically.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                    <IconWorld className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">Multilingual Capability</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Supports multiple languages for prompt generation.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                    <IconShieldCheck className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">Fast and Secure</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Process videos securely and quickly.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefit" className="bg-muted/30 px-4 py-16 md:py-24 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="inline-flex items-center justify-center rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground mb-4">
                Overview
              </span>
              <h2 className="text-balance font-bold text-3xl sm:text-4xl text-foreground">Why Choose Video to Prompt?</h2>
              <p className="mt-4 text-pretty text-muted-foreground">
                Convert videos into detailed prompts using AI technology, designed for professionals seeking quick content generation.
              </p>

              {/* Accordions */}
              <div className="flex flex-col mt-6 w-full border-t border-border">
                {benefits.map((b) => (
                  <div key={b.id} className="border-b border-border py-3">
                    <button
                      onClick={() => setActiveAccordion(activeAccordion === b.id ? null : b.id)}
                      className="flex w-full items-center justify-between py-2 text-left font-medium text-foreground hover:underline cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-base">
                        {b.icon}
                        {b.title}
                      </div>
                      <IconChevronDown className={`size-4 transition-transform duration-200 ${activeAccordion === b.id ? "rotate-180" : ""}`} />
                    </button>
                    {activeAccordion === b.id && (
                      <div className="pt-1 pb-3 text-sm text-muted-foreground leading-relaxed animate-fade-up">
                        {b.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-background">
              <img
                src="/imgs/features/feature-2.png"
                alt="Time-saving Efficiency"
                className="w-full h-auto object-cover min-h-[300px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-4 py-16 md:py-24 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="font-bold text-3xl sm:text-4xl text-foreground">Features</h2>
            <p className="mt-4 text-muted-foreground">Unleash new potentials for video creators.</p>
          </div>

          <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Robust Security", icon: <IconLock className="size-6" />, desc: "Secure handling and analysis of your video data, ensuring privacy at all stages." },
              { title: "Detailed Analysis", icon: <IconZoomScan className="size-6" />, desc: "Analyze video content and obtain precise, detailed prompts." },
              { title: "Multilingual Support", icon: <IconWorld className="size-6" />, desc: "Video analysis in multiple languages, enhancing global accessibility." },
              { title: "Instant Processing", icon: <IconStopwatch className="size-6" />, desc: "Receive video prompts instantly to enhance your workflow efficiency." },
              { title: "Effortless Usability", icon: <IconBulb className="size-6" />, desc: "Simple process: upload video, get detailed prompts in a few clicks." },
              { title: "Interactive AI Experience", icon: <IconRobot className="size-6" />, desc: "Refine and focus video prompts interactively to meet your specific needs." },
            ].map((f, idx) => (
              <div key={idx} className="flex flex-col items-start">
                <span className="flex size-12 items-center justify-center rounded-full border border-primary/30 text-primary bg-primary/5">
                  {f.icon}
                </span>
                <h3 className="mt-5 font-semibold text-lg text-foreground">{f.title}</h3>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section id="stats" className="px-4 py-16 md:py-24 bg-muted/10 border-t border-border">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center">
            <p className="font-semibold text-primary text-sm uppercase tracking-wider">Impressive Facts</p>
            <h2 className="mt-3 font-bold text-3xl sm:text-4xl text-foreground">Why Choose Video to Prompt?</h2>
            <p className="mt-3 text-muted-foreground">Key highlights of Video to Prompt&apos;s services</p>
          </div>

          <div className="mt-12 grid gap-8 text-center sm:grid-cols-3">
            <div>
              <p className="font-semibold text-muted-foreground text-sm">Used by</p>
              <div className="mt-2 font-bold text-6xl text-primary tabular-nums">1000+</div>
              <p className="mt-2 text-muted-foreground text-sm">users worldwide</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground text-sm">Available in</p>
              <div className="mt-2 font-bold text-6xl text-primary tabular-nums">15</div>
              <p className="mt-2 text-muted-foreground text-sm">languages supported</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground text-sm">Completed within</p>
              <div className="mt-2 font-bold text-6xl text-primary tabular-nums">10s</div>
              <p className="mt-2 text-muted-foreground text-sm">average process time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Generators Grid */}
      <section id="generators" className="px-4 py-16 md:py-24 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance font-bold text-3xl sm:text-4xl text-foreground">Adapt Prompts for Top AI Video Generators</h2>
            <p className="mt-4 text-pretty text-muted-foreground leading-relaxed">
              Generate high-fidelity, descriptive text-to-video prompts to replicate and optimize stunning visual styles on leading AI video generation platforms.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/kling", tag: "Kling AI", title: "Kling AI Prompt Generator", icon: <IconMovie className="size-5" />, desc: "Turn any idea into a Kling AI prompt with cinematic camera moves, tracking shots, and consistent character motion for realistic 1080p text-to-video output." },
              { href: "/runway", tag: "Runway", title: "Runway Prompt Generator", icon: <IconSparkles className="size-5" />, desc: "Build detailed Runway prompts with cinematographic direction, volumetric lighting, and color-grading cues to produce stunning commercials and VFX on Runway Gen-3 and Gen-4." },
              { href: "/seedance", tag: "Seedance", title: "Seedance Prompt Generator", icon: <IconVideo className="size-5" />, desc: "Generate shot-by-shot Seedance prompts with smooth multi-shot motion, stable subjects, and native cinematic framing—optimized for ByteDance Seedance." },
              { href: "/veo", tag: "Veo 3", title: "Veo 3 Prompt Generator", icon: <IconCpu className="size-5" />, desc: "Craft Veo 3 prompts complete with scene, camera, and synchronized audio cues—dialogue, sound effects, and music—to unlock Google Veo 3's native sound generation." },
            ].map((gen, idx) => (
              <Link key={idx} href={gen.href} className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {gen.icon}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground text-xs">{gen.tag}</span>
                </div>
                <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{gen.title}</h3>
                <p className="mt-2 flex-1 text-muted-foreground text-sm leading-relaxed">{gen.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 font-medium text-primary text-sm">
                  Open Generator
                  <IconArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="px-4 py-16 md:py-24 border-t border-border">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="uppercase tracking-wider text-primary font-semibold text-sm">Video to Prompt FAQ</p>
            <h2 className="text-balance text-2xl md:text-3xl text-foreground font-semibold mt-2">
              The most common questions about Video to Prompt.
            </h2>
          </div>

          <div className="mx-auto mt-12 max-w-4xl">
            <div className="flex flex-col ring-primary/10 w-full rounded-2xl border border-border px-4 py-3 shadow-sm sm:px-8 bg-card">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border-b border-dashed border-border py-4 last:border-b-0">
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="flex w-full items-center justify-between text-left font-medium text-foreground hover:underline cursor-pointer"
                  >
                    <span className="text-base md:text-lg">{faq.question}</span>
                    <IconChevronDown className={`size-4 shrink-0 transition-transform duration-200 ${activeFaq === idx ? "rotate-180" : ""}`} />
                  </button>
                  {activeFaq === idx && (
                    <div className="mt-2 text-sm text-muted-foreground leading-relaxed animate-fade-up">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section id="call-to-action" className="relative overflow-hidden px-4 py-20 md:py-28 border-t border-border bg-gradient-to-br from-primary/5 via-muted/50 to-primary/5">
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-balance text-4xl font-semibold lg:text-5xl text-foreground">
            Leverage the Power of AI
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Provide your content, and our tool turns it into refined, accurate, and engaging text to enhance your message.
          </p>
          <div className="mt-8">
            <Link
              href="#hero"
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all h-12 px-8 hover:opacity-90 cursor-pointer"
            >
              Try Online Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
