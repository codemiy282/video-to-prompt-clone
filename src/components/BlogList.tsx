"use client";

import Link from "next/link";
import { IconCalendar, IconArrowRight } from "@tabler/icons-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { BlogPost } from "@/lib/wordpress";

/**
 * The posts are fetched on the server; this component exists only so the
 * surrounding labels and the date format can follow the reader's language —
 * `useLanguage` is a client hook and must stay inside the client tree.
 */
export default function BlogList({ posts }: { posts: BlogPost[] }) {
  const { t, locale } = useLanguage();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <>
      <div className="text-center">
        <h1 className="font-bold text-4xl text-foreground sm:text-5xl">{t("blog.title")}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
          {t("blog.subtitle")}
        </p>
      </div>

      {posts.length === 0 ? (
        // Also what shows while WordPress is unreachable — the blog going quiet
        // must never look like the site is broken.
        <p className="mt-16 text-center text-muted-foreground text-sm">{t("blog.empty")}</p>
      ) : (
        <div className="mt-12 space-y-4">
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <Link href={`/blog/${post.slug}`} className="group block">
                <h2 className="font-semibold text-foreground text-xl leading-snug group-hover:text-primary">
                  {post.title}
                </h2>
                <p className="mt-1.5 flex items-center gap-1.5 text-muted-foreground text-xs">
                  <IconCalendar className="size-3.5" />
                  {formatDate(post.date)}
                </p>
                {post.excerpt && (
                  <p className="mt-3 line-clamp-3 text-muted-foreground text-sm leading-relaxed">
                    {post.excerpt}
                  </p>
                )}
                <span className="mt-4 inline-flex items-center gap-1 font-medium text-primary text-sm">
                  {t("blog.readMore")}
                  <IconArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
