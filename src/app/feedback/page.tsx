"use client";

import { useState } from "react";
import {
  IconMessage2,
  IconBulb,
  IconBug,
  IconSend,
  IconLoader2,
  IconCircleCheck,
} from "@tabler/icons-react";
import { useLanguage } from "@/i18n/LanguageContext";

type FeedbackType = "feedback" | "feature" | "bug";

export default function FeedbackPage() {
  const { t } = useLanguage();
  const [type, setType] = useState<FeedbackType>("feedback");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const types: { key: FeedbackType; label: string; Icon: typeof IconMessage2 }[] = [
    { key: "feedback", label: t("fb.typeFeedback"), Icon: IconMessage2 },
    { key: "feature", label: t("fb.typeFeature"), Icon: IconBulb },
    { key: "bug", label: t("fb.typeBug"), Icon: IconBug },
  ];

  async function handleSubmit() {
    if (!message.trim()) {
      setError(t("fb.errorEmpty"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, message: message.trim(), name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
      } else {
        setError(data.message || t("fb.errorFailed"));
      }
    } catch {
      setError(t("fb.errorFailed"));
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setDone(false);
    setMessage("");
    setName("");
    setEmail("");
    setType("feedback");
    setError(null);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <section className="pt-12 pb-20">
        <div className="container mx-auto max-w-2xl px-6">
          <div className="text-center">
            <h1 className="font-bold text-4xl text-foreground sm:text-5xl">{t("fb.title")}</h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">{t("fb.subtitle")}</p>
          </div>

          {done ? (
            <div className="mt-10 rounded-2xl border border-green-500/30 bg-green-500/5 p-8 text-center">
              <IconCircleCheck className="mx-auto size-12 text-green-500" />
              <h2 className="mt-4 font-semibold text-xl text-foreground">{t("fb.successTitle")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("fb.successDesc")}</p>
              <button
                type="button"
                onClick={reset}
                className="mt-6 inline-flex items-center justify-center rounded-lg border border-border px-5 h-10 text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                {t("fb.another")}
              </button>
            </div>
          ) : (
            <div className="mt-10 space-y-6">
              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">{t("fb.typeLabel")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {types.map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setType(key)}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-3 h-11 text-sm font-medium transition-colors cursor-pointer ${
                        type === key
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="size-4" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">{t("fb.messageLabel")}</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("fb.messagePlaceholder")}
                  maxLength={2000}
                  className="w-full h-36 rounded-lg bg-transparent border-2 border-border p-3 text-sm focus:border-primary text-foreground resize-none outline-none"
                />
              </div>

              {/* Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">{t("fb.nameLabel")}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("fb.namePlaceholder")}
                    maxLength={100}
                    className="w-full rounded-lg bg-transparent border-2 border-border px-3 h-11 text-sm focus:border-primary text-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">{t("fb.emailLabel")}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("fb.emailPlaceholder")}
                    maxLength={200}
                    className="w-full rounded-lg bg-transparent border-2 border-border px-3 h-11 text-sm focus:border-primary text-foreground outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <button
                type="button"
                disabled={!message.trim() || loading}
                onClick={handleSubmit}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm h-12 px-8 hover:opacity-90 disabled:opacity-50 cursor-pointer transition-all"
              >
                {loading ? <IconLoader2 className="size-4 animate-spin" /> : <IconSend className="size-4" />}
                {loading ? t("fb.submitting") : t("fb.submit")}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
