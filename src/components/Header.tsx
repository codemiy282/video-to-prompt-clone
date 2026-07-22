"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import { useLanguage } from "@/i18n/LanguageContext";
import { localeNames, locales } from "@/i18n/config";
import { IconChevronDown, IconLanguage, IconMenu2, IconX } from "@tabler/icons-react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [generatorsOpen, setGeneratorsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const pathname = usePathname();
  const { t, locale, setLocale } = useLanguage();

  // Close any open menu when the route changes via client-side navigation.
  useEffect(() => {
    setGeneratorsOpen(false);
    setMobileMenuOpen(false);
    setLangOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 transition-all duration-300">
      <div className="container mx-auto max-w-7xl px-4">
        <nav aria-label="Main navigation" className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link aria-label="Home" className="flex items-center gap-2 shrink-0" href="/">
            <Logo />
            <span className="text-xl font-semibold tracking-tight text-foreground">Video to Prompt</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex lg:items-center lg:gap-3 xl:gap-5 flex-1 justify-center">
            <div className="relative">
              <button
                type="button"
                onClick={() => setGeneratorsOpen(!generatorsOpen)}
                className="group inline-flex h-9 w-max items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus:outline-none cursor-pointer text-foreground"
              >
                {t("nav.generators")}
                <IconChevronDown className={`ml-1 size-3 transition-transform duration-200 ${generatorsOpen ? "rotate-180" : ""}`} />
              </button>
              {generatorsOpen && (
                <div className="absolute left-0 mt-2 w-48 rounded-md border border-border bg-card p-1 shadow-md z-50">
                  <Link href="/kling" className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted">{t("nav.sub.kling")}</Link>
                  <Link href="/runway" className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted">{t("nav.sub.runway")}</Link>
                  <Link href="/seedance" className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted">{t("nav.sub.seedance")}</Link>
                  <Link href="/veo" className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted">{t("nav.sub.veo")}</Link>
                </div>
              )}
            </div>
            <Link href="/image-to-video" className="inline-flex h-9 w-max items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              {t("nav.imageToVideo")}
            </Link>
            <Link href="/image-to-prompt" className="inline-flex h-9 w-max items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              {t("nav.imageToPrompt")}
            </Link>
            <Link href="/storyboard" className="inline-flex h-9 w-max items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              {t("nav.storyboard")}
            </Link>
            <Link href="/projects" className="inline-flex h-9 w-max items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              {t("nav.projects")}
            </Link>
            <Link href="/prompt-converter" className="inline-flex h-9 w-max items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              {t("nav.converter")}
            </Link>
            <Link href="/validator" className="inline-flex h-9 w-max items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              {t("nav.validator")}
            </Link>
            <Link href="/models" className="inline-flex h-9 w-max items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              {t("nav.models")}
            </Link>
            <Link href="/feedback" className="inline-flex h-9 w-max items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              {t("nav.feedback")}
            </Link>
          </div>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <div className="relative">
              <button
                type="button"
                aria-label={t("lang.select")}
                onClick={() => setLangOpen(!langOpen)}
                className="flex w-fit items-center justify-between rounded-lg border border-input px-2 h-9 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer gap-1.5"
              >
                <IconLanguage className="size-4" />
                <span>{localeNames[locale]}</span>
                <IconChevronDown className={`size-4 transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-md border border-border bg-card p-1 shadow-md z-50">
                  {locales.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => { setLocale(l); setLangOpen(false); }}
                      className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${l === locale ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                    >
                      {localeNames[l]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-4">
            <ThemeToggle />
            <button
              type="button"
              aria-label={t("nav.menu")}
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
            <div className="px-3 py-2 font-semibold text-sm text-foreground">{t("nav.generators")}</div>
            <div className="pl-4 flex flex-col gap-1 border-l border-border ml-3">
              <Link href="/kling" className="py-2 text-sm text-muted-foreground hover:text-foreground">{t("nav.sub.kling")}</Link>
              <Link href="/runway" className="py-2 text-sm text-muted-foreground hover:text-foreground">{t("nav.sub.runway")}</Link>
              <Link href="/seedance" className="py-2 text-sm text-muted-foreground hover:text-foreground">{t("nav.sub.seedance")}</Link>
              <Link href="/veo" className="py-2 text-sm text-muted-foreground hover:text-foreground">{t("nav.sub.veo")}</Link>
            </div>
            <Link href="/image-to-video" className="px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg">
              {t("nav.imageToVideo")}
            </Link>
            <Link href="/image-to-prompt" className="px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg">
              {t("nav.imageToPrompt")}
            </Link>
            <Link href="/storyboard" className="px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg">
              {t("nav.storyboard")}
            </Link>
            <Link href="/projects" className="px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg">
              {t("nav.projects")}
            </Link>
            <Link href="/prompt-converter" className="px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg">
              {t("nav.converter")}
            </Link>
            <Link href="/validator" className="px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg">
              {t("nav.validator")}
            </Link>
            <Link href="/models" className="px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg">
              {t("nav.models")}
            </Link>
            <Link href="/feedback" className="px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg">
              {t("nav.feedback")}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
