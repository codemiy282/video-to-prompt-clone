"use client";

import Link from "next/link";
import { IconArrowLeft, IconCalendar } from "@tabler/icons-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { BlogPost } from "@/lib/wordpress";

export default function BlogArticle({ post }: { post: BlogPost }) {
  const { t, locale } = useLanguage();

  const date = new Date(post.date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article>
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
      >
        <IconArrowLeft className="size-4" />
        {t("blog.back")}
      </Link>

      <h1 className="font-bold text-3xl text-foreground leading-tight sm:text-4xl">
        {post.title}
      </h1>
      <p className="mt-3 flex items-center gap-1.5 text-muted-foreground text-sm">
        <IconCalendar className="size-4" />
        {date}
      </p>

      {post.featuredImage && (
        // eslint-disable-next-line @next/next/no-img-element -- the URL comes
        // from WordPress at request time, so it cannot be statically optimised
        // without configuring every future host in next.config.
        <img
          src={post.featuredImage.url}
          alt={post.featuredImage.alt}
          className="mt-8 w-full rounded-2xl border border-border"
        />
      )}

      {/*
        Content is HTML rendered by WordPress. It is trusted because it can only
        come from our own authenticated backend, and every post passes through a
        human who publishes it out of draft — n8n cannot publish on its own.
      */}
      <div
        className="prose-blog mt-8"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
