"use client";

import {
  IconInfoCircle,
  IconCheck,
  IconX,
  IconExternalLink,
  IconVideo,
  IconPhoto,
} from "@tabler/icons-react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  MODEL_REGISTRY,
  CAPABILITY_KEYS,
  type CapabilityKey,
} from "@/lib/modelRegistry";

const CAP_LABEL: Record<CapabilityKey, string> = {
  audio: "models.capAudio",
  firstFrame: "models.capFirstFrame",
  lastFrame: "models.capLastFrame",
  referenceImage: "models.capReference",
  cameraControls: "models.capCamera",
};

export default function ModelsPage() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <section className="pt-12 pb-20">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h1 className="font-bold text-4xl text-foreground sm:text-5xl">{t("models.title")}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">{t("models.subtitle")}</p>
          </div>

          {/* Disclaimer */}
          <div className="mx-auto mt-8 flex max-w-3xl items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
            <IconInfoCircle className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <p className="text-xs leading-relaxed text-muted-foreground">{t("models.disclaimer")}</p>
          </div>

          {/* Model cards */}
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {MODEL_REGISTRY.map((m) => (
              <div key={m.id} className="flex flex-col rounded-2xl border border-border bg-card p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-lg text-foreground">{m.name}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {m.vendor} · {m.version}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {m.inputModes.includes("text") && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        <IconVideo className="size-3" /> {t("models.modeText")}
                      </span>
                    )}
                    {m.inputModes.includes("image") && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        <IconPhoto className="size-3" /> {t("models.modeImage")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Capability grid */}
                <div className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {CAPABILITY_KEYS.map((cap) => {
                    const on = m[cap];
                    return (
                      <div key={cap} className="flex items-center gap-2 text-sm">
                        {on ? (
                          <IconCheck className="size-4 shrink-0 text-green-500" />
                        ) : (
                          <IconX className="size-4 shrink-0 text-muted-foreground/50" />
                        )}
                        <span className={on ? "text-foreground" : "text-muted-foreground/60"}>
                          {t(CAP_LABEL[cap])}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Specs */}
                <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted-foreground">{t("models.aspect")}:</dt>
                    <dd className="text-foreground">{m.aspectRatios.join(", ")}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted-foreground">{t("models.duration")}:</dt>
                    <dd className="text-foreground">{m.duration}</dd>
                  </div>
                </dl>

                {/* Guidance */}
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("models.guidance")}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground">{m.promptGuidance}</p>
                </div>

                {/* Limitations */}
                {m.limitations.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("models.limitations")}</p>
                    <ul className="mt-1.5 space-y-1">
                      {m.limitations.map((lim, i) => (
                        <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="text-muted-foreground/50">•</span>
                          <span>{lim}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">
                    {t("models.verified", { date: m.lastUpdated })}
                  </span>
                  <a
                    href={m.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    {t("models.docs")}
                    <IconExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
