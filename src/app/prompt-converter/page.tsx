"use client";

import { useState } from "react";
import {
  IconWand,
  IconLoader2,
  IconCopy,
  IconCheck,
  IconAlertTriangle,
  IconVideo,
  IconPhoto,
} from "@tabler/icons-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { MODEL_REGISTRY, type InputMode } from "@/lib/modelRegistry";

interface ConvertResult {
  model: string;
  name: string;
  prompt: string;
  warnings: string[];
}

export default function PromptConverterPage() {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(MODEL_REGISTRY.map((m) => m.id))
  );
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ConvertResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function toggleModel(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConvert() {
    if (!prompt.trim() || selected.size === 0) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/convert-prompt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          models: [...selected],
          inputMode,
        }),
      });
      const data = await res.json();
      if (data.success) setResults(data.results);
      else setError(data.message || t("convert.errorFailed"));
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  async function copy(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <section className="pt-12 pb-20">
        <div className="container mx-auto max-w-3xl px-6">
          <div className="text-center">
            <h1 className="font-bold text-4xl text-foreground sm:text-5xl">{t("convert.title")}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">{t("convert.subtitle")}</p>
          </div>

          <div className="mt-10 space-y-6">
            {/* Base prompt */}
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">{t("convert.promptLabel")}</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("convert.promptPlaceholder")}
                maxLength={4000}
                className="w-full h-32 rounded-lg bg-transparent border-2 border-border p-3 text-sm focus:border-primary text-foreground resize-none outline-none"
              />
            </div>

            {/* Input mode */}
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">{t("convert.inputMode")}</label>
              <div className="grid grid-cols-2 gap-2 max-w-sm">
                {(["text", "image"] as InputMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setInputMode(mode)}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 h-11 text-sm font-medium transition-colors cursor-pointer ${
                      inputMode === mode
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {mode === "text" ? <IconVideo className="size-4" /> : <IconPhoto className="size-4" />}
                    {mode === "text" ? t("convert.modeText") : t("convert.modeImage")}
                  </button>
                ))}
              </div>
            </div>

            {/* Target models */}
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">{t("convert.targets")}</label>
              <div className="flex flex-wrap gap-2">
                {MODEL_REGISTRY.map((m) => {
                  const on = selected.has(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleModel(m.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 h-10 text-sm font-medium transition-colors cursor-pointer ${
                        on
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {on && <IconCheck className="size-3.5 text-primary" />}
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={!prompt.trim() || selected.size === 0 || loading}
              onClick={handleConvert}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm h-12 px-8 hover:opacity-90 disabled:opacity-50 cursor-pointer transition-all"
            >
              {loading ? <IconLoader2 className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loading ? t("convert.converting") : t("convert.convert")}
            </button>
          </div>

          {/* Results */}
          {results && (
            <div className="mt-10 space-y-5">
              {results.map((r) => (
                <div key={r.model} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="font-semibold text-base text-foreground">{r.name}</h3>
                    <button
                      onClick={() => copy(r.model, r.prompt)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      {copiedId === r.model ? (
                        <><IconCheck className="size-4 text-green-500" /> {t("common.copied")}</>
                      ) : (
                        <><IconCopy className="size-4" /> {t("common.copy")}</>
                      )}
                    </button>
                  </div>

                  {r.warnings.length > 0 && (
                    <div className="mb-3 space-y-1.5">
                      {r.warnings.map((w) => (
                        <div key={w} className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs text-muted-foreground">
                          <IconAlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                          <span>{t(`convert.warn.${w}`)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{r.prompt}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
