"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
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
  const { t, locale } = useLanguage();

  async function postPrompt(body: FormData) {
    body.append("lang", locale);
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
        setError(data.error?.message || t("common.requestFailed"));
      }
    } catch {
      setError(t("common.networkError"));
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
      title: t("home.benefit.timeSavingTitle"),
      icon: <IconBolt className="size-4" />,
      content: t("home.benefit.timeSavingContent"),
    },
    {
      id: "global",
      title: t("home.benefit.globalTitle"),
      icon: <IconWorld className="size-4" />,
      content: t("home.benefit.globalContent"),
    },
    {
      id: "insights",
      title: t("home.benefit.insightsTitle"),
      icon: <IconMessage2 className="size-4" />,
      content: t("home.benefit.insightsContent"),
    },
  ];

  const faqs = [
    { question: t("home.faq.q1"), answer: t("home.faq.a1") },
    { question: t("home.faq.q2"), answer: t("home.faq.a2") },
    { question: t("home.faq.q3"), answer: t("home.faq.a3") },
    { question: t("home.faq.q4"), answer: t("home.faq.a4") },
    { question: t("home.faq.q5"), answer: t("home.faq.a5") },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased transition-colors duration-300">
      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden pt-12 pb-16">
        {/* Ambient dot-grid texture (fills empty space, stays subtle) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-dot-grid"></div>
        {/* Background Gradients */}
        <div aria-hidden="true" className="absolute inset-0 isolate hidden opacity-40 dark:opacity-60 contain-strict lg:block pointer-events-none">
          <div className="w-[35rem] h-[80rem] -translate-y-[22rem] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,oklch(0.85_0.06_262/.14)_0,oklch(0.7_0.04_262/.05)_50%,transparent_80%)]"></div>
          <div className="h-[80rem] absolute left-0 top-0 w-[15rem] -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,oklch(0.88_0.07_262/.12)_0,oklch(0.6_0.04_262/.04)_80%,transparent_100%)] translate-x-[5%] -translate-y-[50%]"></div>
        </div>

        <div className="container mx-auto max-w-7xl px-6 relative z-10">
          <div className="text-center sm:mx-auto">
            <h1 className="animate-fade-up delay-1 text-balance font-bold tracking-tighter text-4xl text-foreground sm:text-5xl md:text-6xl xl:text-7xl">
              Video to Prompt
            </h1>
            <p className="animate-fade-up delay-2 mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              {t("home.hero.subtitle")}
            </p>
            <div className="animate-fade-up delay-2 mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <IconStopwatch className="size-4 text-primary" />
                {t("home.hero.value1")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconSparkles className="size-4 text-primary" />
                {t("home.hero.value2")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconBolt className="size-4 text-primary" />
                {t("home.hero.value3")}
              </span>
            </div>
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
                {t("home.tab.image")}
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
                    placeholder={t("home.url.placeholder")}
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
                  {t("home.url.submit")}
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
                    {loading ? t("home.upload.loading") : t("home.upload.title")}
                  </h3>
                  <p className="mx-auto max-w-md text-muted-foreground text-sm leading-7">
                    {t("home.upload.desc")}
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
                  {t("home.generating")}
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
                    <h3 className="font-semibold text-foreground">{t("home.result.title")}</h3>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted/50 cursor-pointer"
                    >
                      {copied ? t("common.copied") : t("common.copy")}
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
              <h2 className="text-balance font-bold tracking-tight text-3xl sm:text-4xl text-foreground">{t("home.intro.title")}</h2>
              <p className="mt-4 text-pretty text-muted-foreground leading-relaxed">
                {t("home.intro.desc")}
              </p>
              <ul className="mt-8 space-y-6">
                <li className="flex items-start gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <IconPlayerPlayFilled className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">{t("home.intro.videoAnalysis")}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{t("home.intro.videoAnalysisDesc")}</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <IconWorld className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">{t("home.intro.multilingual")}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{t("home.intro.multilingualDesc")}</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <IconShieldCheck className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">{t("home.intro.secure")}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{t("home.intro.secureDesc")}</p>
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
                {t("home.benefit.overviewBadge")}
              </span>
              <h2 className="text-balance font-bold tracking-tight text-3xl sm:text-4xl text-foreground">{t("home.whyTitle")}</h2>
              <p className="mt-4 text-pretty text-muted-foreground">
                {t("home.benefit.desc")}
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
            <h2 className="font-bold tracking-tight text-3xl sm:text-4xl text-foreground">{t("home.features.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("home.features.desc")}</p>
          </div>

          <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: t("home.features.robustSecurityTitle"), icon: <IconLock className="size-6" />, desc: t("home.features.robustSecurityDesc") },
              { title: t("home.features.detailedAnalysisTitle"), icon: <IconZoomScan className="size-6" />, desc: t("home.features.detailedAnalysisDesc") },
              { title: t("home.features.multilingualTitle"), icon: <IconWorld className="size-6" />, desc: t("home.features.multilingualDesc") },
              { title: t("home.features.instantProcessingTitle"), icon: <IconStopwatch className="size-6" />, desc: t("home.features.instantProcessingDesc") },
              { title: t("home.features.effortlessTitle"), icon: <IconBulb className="size-6" />, desc: t("home.features.effortlessDesc") },
              { title: t("home.features.interactiveAITitle"), icon: <IconRobot className="size-6" />, desc: t("home.features.interactiveAIDesc") },
            ].map((f, idx) => (
              <div key={idx} className="flex flex-col items-start">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
            <p className="font-semibold text-primary text-sm uppercase tracking-wider">{t("home.stats.kicker")}</p>
            <h2 className="mt-3 font-bold tracking-tight text-3xl sm:text-4xl text-foreground">{t("home.whyTitle")}</h2>
            <p className="mt-3 text-muted-foreground">{t("home.stats.note")}</p>
          </div>

          <div className="mt-12 grid gap-8 text-center sm:grid-cols-3">
            <div>
              <p className="font-semibold text-muted-foreground text-sm">{t("home.stats.usedBy")}</p>
              <div className="mt-2 font-bold text-6xl text-primary tabular-nums">Free</div>
              <p className="mt-2 text-muted-foreground text-sm">{t("home.stats.usedBySub")}</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground text-sm">{t("home.stats.availableIn")}</p>
              <div className="mt-2 font-bold text-6xl text-primary tabular-nums">3</div>
              <p className="mt-2 text-muted-foreground text-sm">{t("home.stats.availableInSub")}</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground text-sm">{t("home.stats.completedIn")}</p>
              <div className="mt-2 font-bold text-6xl text-primary tabular-nums">~10s</div>
              <p className="mt-2 text-muted-foreground text-sm">{t("home.stats.completedInSub")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Generators Grid */}
      <section id="generators" className="px-4 py-16 md:py-24 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance font-bold tracking-tight text-3xl sm:text-4xl text-foreground">{t("home.generators.title")}</h2>
            <p className="mt-4 text-pretty text-muted-foreground leading-relaxed">
              {t("home.generators.desc")}
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/kling", tag: t("home.generators.klingTag"), title: t("home.generators.klingTitle"), icon: <IconMovie className="size-5" />, desc: t("home.generators.klingDesc") },
              { href: "/runway", tag: t("home.generators.runwayTag"), title: t("home.generators.runwayTitle"), icon: <IconSparkles className="size-5" />, desc: t("home.generators.runwayDesc") },
              { href: "/seedance", tag: t("home.generators.seedanceTag"), title: t("home.generators.seedanceTitle"), icon: <IconVideo className="size-5" />, desc: t("home.generators.seedanceDesc") },
              { href: "/veo", tag: t("home.generators.veoTag"), title: t("home.generators.veoTitle"), icon: <IconCpu className="size-5" />, desc: t("home.generators.veoDesc") },
            ].map((gen, idx) => (
              <Link key={idx} href={gen.href} className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {gen.icon}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground text-xs">{gen.tag}</span>
                </div>
                <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{gen.title}</h3>
                <p className="mt-2 flex-1 text-muted-foreground text-sm leading-relaxed">{gen.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 font-medium text-primary text-sm">
                  {t("home.generators.open")}
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
            <p className="uppercase tracking-wider text-primary font-semibold text-sm">{t("home.faq.kicker")}</p>
            <h2 className="text-balance text-2xl md:text-3xl text-foreground font-semibold tracking-tight mt-2">
              {t("home.faq.title")}
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
          <h2 className="text-balance text-4xl font-semibold tracking-tight lg:text-5xl text-foreground">
            {t("home.cta.title")}
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            {t("home.cta.desc")}
          </p>
          <div className="mt-8">
            <Link
              href="#hero"
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all h-12 px-8 hover:opacity-90 cursor-pointer"
            >
              {t("home.cta.button")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
