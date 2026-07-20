"use client";

import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { useLanguage } from "@/i18n/LanguageContext";

const LAST_UPDATED = "2026-07-20";
const SECTIONS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"] as const;

export default function TermsPage() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <section className="pt-12 pb-20">
        <div className="container mx-auto max-w-3xl px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <IconArrowLeft className="size-4" />
            {t("legal.backHome")}
          </Link>

          <h1 className="font-bold text-4xl text-foreground sm:text-5xl">
            {t("legal.terms.title")}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("legal.updated", { date: LAST_UPDATED })}
          </p>
          <p className="mt-6 text-base text-muted-foreground leading-relaxed">
            {t("legal.terms.intro")}
          </p>

          <div className="mt-10 space-y-8">
            {SECTIONS.map((s) => (
              <div key={s}>
                <h2 className="font-semibold text-lg text-foreground">
                  {t(`legal.terms.${s}Title`)}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {t(`legal.terms.${s}Body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
