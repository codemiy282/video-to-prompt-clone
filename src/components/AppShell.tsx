"use client";

import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/i18n/LanguageContext";

// Header and Footer consume the language context, so they must live inside the
// same client boundary as the provider. Rendering them here (rather than as
// server-created children of LanguageProvider in the root layout) keeps the
// context resolvable during isolated prerenders such as /_not-found.
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </LanguageProvider>
  );
}
