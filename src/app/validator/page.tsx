"use client";

import { useState } from "react";
import {
  IconShieldCheck,
  IconLoader2,
  IconBulb,
  IconCircleCheck,
  IconAlertTriangle,
  IconCircleX,
} from "@tabler/icons-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { MODEL_REGISTRY } from "@/lib/modelRegistry";

interface Criterion {
  name: string;
  rating: string;
  note: string;
}
interface Result {
  score: number;
  criteria: Criterion[];
  suggestions: string[];
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

function ratingStyle(rating: string): { cls: string; icon: React.ReactNode } {
  if (rating.startsWith("strong"))
    return { cls: "text-green-600 dark:text-green-400", icon: <IconCircleCheck className="size-4 text-green-500" /> };
  if (rating.startsWith("weak"))
    return { cls: "text-red-600 dark:text-red-400", icon: <IconCircleX className="size-4 text-red-500" /> };
  return { cls: "text-amber-600 dark:text-amber-400", icon: <IconAlertTriangle className="size-4 text-amber-500" /> };
}

export default function ValidatorPage() {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/validate-prompt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), model: model ?? undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ score: data.score, criteria: data.criteria, suggestions: data.suggestions });
      } else {
        setError(data.message || t("validator.errorFailed"));
      }
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  function ratingLabel(rating: string): string {
    if (rating.startsWith("strong")) return t("validator.strong");
    if (rating.startsWith("weak")) return t("validator.weak");
    return t("validator.fair");
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased transition-colors duration-300">
      <section className="pt-12 pb-20">
        <div className="container mx-auto max-w-3xl px-6">
          <div className="text-center">
            <h1 className="font-bold tracking-tight text-4xl text-foreground sm:text-5xl">{t("validator.title")}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">{t("validator.subtitle")}</p>
          </div>

          <div className="mt-10 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">{t("validator.promptLabel")}</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("validator.promptPlaceholder")}
                maxLength={6000}
                className="w-full h-40 rounded-lg bg-transparent border-2 border-border p-3 text-sm focus:border-primary text-foreground resize-none outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">{t("validator.scoreFor")}</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setModel(null)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 h-10 text-sm font-medium transition-colors cursor-pointer ${
                    model === null
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {t("validator.general")}
                </button>
                {MODEL_REGISTRY.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 h-10 text-sm font-medium transition-colors cursor-pointer ${
                      model === m.id
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={!prompt.trim() || loading}
              onClick={handleAnalyze}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm h-12 px-8 hover:opacity-90 disabled:opacity-50 cursor-pointer transition-all"
            >
              {loading ? <IconLoader2 className="size-4 animate-spin" /> : <IconShieldCheck className="size-4" />}
              {loading ? t("validator.analyzing") : t("validator.analyze")}
            </button>
          </div>

          {result && (
            <div className="mt-10 space-y-6">
              {/* Score */}
              <div className="rounded-2xl border border-border bg-card p-6 text-center">
                <p className="text-sm font-medium text-muted-foreground">{t("validator.scoreLabel")}</p>
                <div className={`mt-1 font-bold text-6xl tabular-nums ${scoreColor(result.score)}`}>
                  {result.score}
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
              </div>

              {/* Criteria */}
              {result.criteria.length > 0 && (
                <div>
                  <h2 className="mb-3 text-sm font-semibold text-foreground">{t("validator.criteriaLabel")}</h2>
                  <div className="space-y-2">
                    {result.criteria.map((c, i) => {
                      const rs = ratingStyle(c.rating);
                      return (
                        <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                          <span className="mt-0.5 shrink-0">{rs.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{c.name}</span>
                              <span className={`text-xs font-semibold uppercase ${rs.cls}`}>{ratingLabel(c.rating)}</span>
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground">{c.note}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <div>
                  <h2 className="mb-3 text-sm font-semibold text-foreground">{t("validator.suggestionsLabel")}</h2>
                  <div className="space-y-2">
                    {result.suggestions.map((s, i) => (
                      <div key={i} className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
                        <IconBulb className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
