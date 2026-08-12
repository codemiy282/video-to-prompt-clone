"use client";

import Link from "next/link";
import {
  IconBook,
  IconRocket,
  IconMovie,
  IconCamera,
  IconThumbUp,
  IconThumbDown,
  IconGauge,
  IconExternalLink,
} from "@tabler/icons-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { MODEL_REGISTRY } from "@/lib/modelRegistry";
import { UPLOAD_MAX_LABEL } from "@/lib/uploadLimits";

/** Numbered steps in the quick-start section. */
const STEPS = ["s1", "s2", "s3", "s4", "s5"] as const;

/** Glossary groups, each with a fixed number of terms in the dictionaries. */
const GLOSSARY = [
  { key: "shot", terms: ["wide", "medium", "closeup", "extreme", "over"] },
  { key: "camera", terms: ["static", "pan", "tilt", "dolly", "tracking", "crane"] },
  { key: "light", terms: ["golden", "soft", "hard", "back", "practical"] },
] as const;

function Section({
  id,
  icon,
  title,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-border border-t pt-10">
      <h2 className="flex items-center gap-2.5 font-semibold text-2xl text-foreground">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function GuidePage() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
      <section className="pt-12 pb-20">
        <div className="container mx-auto max-w-3xl px-6">
          <h1 className="font-bold text-4xl text-foreground sm:text-5xl">{t("guide.title")}</h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            {t("guide.subtitle")}
          </p>

          {/* Jump links — the page is long and most people arrive with one
              question, not a desire to read it end to end. */}
          <nav aria-label={t("guide.contents")} className="mt-8 flex flex-wrap gap-2">
            {[
              ["start", t("guide.start.title")],
              ["models", t("guide.models.title")],
              ["glossary", t("guide.glossary.title")],
              ["recipes", t("guide.recipes.title")],
              ["score", t("guide.score.title")],
            ].map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="mt-12 space-y-12">
            {/* ------------------------------ Quick start */}
            <Section id="start" icon={<IconRocket className="size-5" />} title={t("guide.start.title")}>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("guide.start.intro")}
              </p>
              <ol className="mt-5 space-y-4">
                {STEPS.map((s, i) => (
                  <li key={s} className="flex gap-4">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {t(`guide.start.${s}Title`)}
                      </p>
                      <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                        {t(`guide.start.${s}Body`)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-5 rounded-xl border border-border bg-muted/40 px-4 py-3 text-muted-foreground text-xs leading-relaxed">
                {t("guide.start.note", { limit: UPLOAD_MAX_LABEL })}
              </p>
            </Section>

            {/* ------------------------------ Per-model */}
            <Section id="models" icon={<IconMovie className="size-5" />} title={t("guide.models.title")}>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("guide.models.intro")}
              </p>
              {/* Everything below is read from the registry: a model that
                  changes version or gains audio updates here automatically,
                  instead of leaving stale claims in this page's copy. */}
              <div className="mt-5 space-y-4">
                {MODEL_REGISTRY.map((m) => (
                  <div key={m.id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-semibold text-base text-foreground">{m.name}</h3>
                      <span className="text-muted-foreground text-xs">{m.vendor}</span>
                    </div>
                    <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                      {m.promptGuidance}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="rounded-md border border-border px-2 py-0.5 text-muted-foreground text-xs">
                        {m.duration}
                      </span>
                      <span className="rounded-md border border-border px-2 py-0.5 text-muted-foreground text-xs">
                        {m.aspectRatios.join(" · ")}
                      </span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-xs ${
                          m.audio
                            ? "border-primary/40 bg-primary/5 text-foreground"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {m.audio ? t("guide.models.hasAudio") : t("guide.models.noAudio")}
                      </span>
                    </div>
                    {m.limitations.length > 0 && (
                      <ul className="mt-3 space-y-1 text-muted-foreground text-xs">
                        {m.limitations.map((l, i) => (
                          <li key={i}>• {l}</li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      <a
                        href={m.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {t("guide.models.docs")}
                        <IconExternalLink className="size-3" />
                      </a>
                      <span className="text-muted-foreground">
                        {t("guide.models.checked", { date: m.lastUpdated })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-muted-foreground text-xs leading-relaxed">
                {t("guide.models.disclaimer")}
              </p>
            </Section>

            {/* ------------------------------ Glossary */}
            <Section id="glossary" icon={<IconCamera className="size-5" />} title={t("guide.glossary.title")}>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("guide.glossary.intro")}
              </p>
              <div className="mt-5 space-y-6">
                {GLOSSARY.map((group) => (
                  <div key={group.key}>
                    <h3 className="font-medium text-foreground text-sm">
                      {t(`guide.glossary.${group.key}Title`)}
                    </h3>
                    <dl className="mt-2 space-y-2">
                      {group.terms.map((term) => (
                        <div
                          key={term}
                          className="grid gap-1 sm:grid-cols-[180px_1fr] sm:gap-4"
                        >
                          <dt className="font-mono text-foreground text-xs">
                            {t(`guide.glossary.${group.key}.${term}Term`)}
                          </dt>
                          <dd className="text-muted-foreground text-sm leading-relaxed">
                            {t(`guide.glossary.${group.key}.${term}Desc`)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </Section>

            {/* ------------------------------ Good vs bad */}
            <Section id="recipes" icon={<IconBook className="size-5" />} title={t("guide.recipes.title")}>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("guide.recipes.intro")}
              </p>
              <div className="mt-5 space-y-5">
                {["r1", "r2", "r3"].map((r) => (
                  <div key={r} className="rounded-2xl border border-border bg-card p-5">
                    <p className="font-medium text-foreground text-sm">
                      {t(`guide.recipes.${r}Title`)}
                    </p>
                    <div className="mt-3 space-y-3">
                      <div className="flex gap-2.5">
                        <IconThumbDown className="mt-0.5 size-4 shrink-0 text-red-500" />
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          <span className="font-mono text-xs">{t(`guide.recipes.${r}Bad`)}</span>
                        </p>
                      </div>
                      <div className="flex gap-2.5">
                        <IconThumbUp className="mt-0.5 size-4 shrink-0 text-green-500" />
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          <span className="font-mono text-xs">{t(`guide.recipes.${r}Good`)}</span>
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 border-border border-t pt-3 text-muted-foreground text-xs leading-relaxed">
                      {t(`guide.recipes.${r}Why`)}
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            {/* ------------------------------ Reading the score */}
            <Section id="score" icon={<IconGauge className="size-5" />} title={t("guide.score.title")}>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("guide.score.intro")}
              </p>
              <div className="mt-5 space-y-3">
                {[
                  ["80", "text-green-500", "high"],
                  ["50", "text-amber-500", "mid"],
                  ["0", "text-red-500", "low"],
                ].map(([n, cls, key]) => (
                  <div key={key} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                    <span className={`font-bold text-2xl tabular-nums ${cls}`}>{n}+</span>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t(`guide.score.${key}`)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
                {t("guide.score.outro")}
              </p>
              <Link
                href="/validator"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 font-medium text-primary-foreground text-sm transition-all hover:opacity-90"
              >
                {t("guide.score.cta")}
              </Link>
            </Section>
          </div>
        </div>
      </section>
    </div>
  );
}
