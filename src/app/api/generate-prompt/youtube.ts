// YouTube context extractor. Resolves a video id, fetches public oEmbed
// metadata + thumbnail, and best-effort scrapes the page description.
// Every network step is wrapped so a failure degrades gracefully rather than
// breaking the request (per docs/blueprint/system-blueprint.md §2.3 fallback).

import type { YouTubeContext } from "./gemini";

const OEmbedUrl = (url: string) =>
  `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;

export function parseVideoId(input: string): string | null {
  const url = input.trim();
  if (!url) return null;

  // youtu.be/<id>
  let m = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (m) return m[1];

  // youtube.com/watch?v=<id>
  m = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (m) return m[1];

  // /shorts/<id> or /embed/<id> or /v/<id>
  m = url.match(/\/(shorts|embed|v)\/([A-Za-z0-9_-]{11})/);
  if (m) return m[2];

  // Bare 11-char id
  m = url.match(/^([A-Za-z0-9_-]{11})$/);
  if (m) return m[1];

  return null;
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

async function toBase64(response: Response): Promise<{ data: string; mime: string }> {
  const buf = Buffer.from(await response.arrayBuffer());
  return {
    data: buf.toString("base64"),
    mime: response.headers.get("content-type") || "image/jpeg",
  };
}

export async function extractContext(url: string): Promise<YouTubeContext> {
  const ctx: YouTubeContext = { url };
  const id = parseVideoId(url);

  // 1) oEmbed — public, keyless, gives title + author + thumbnail.
  try {
    const res = await fetchWithTimeout(OEmbedUrl(url), 8000);
    if (res.ok) {
      const data = (await res.json()) as {
        title?: string;
        author_name?: string;
        thumbnail_url?: string;
      };
      if (data.title) ctx.title = data.title;
      if (data.author_name) ctx.author = data.author_name;

      // 2) Download the thumbnail for a visual frame to send to Gemini.
      if (data.thumbnail_url) {
        try {
          const tRes = await fetchWithTimeout(data.thumbnail_url, 8000);
          if (tRes.ok) {
            const img = await toBase64(tRes);
            ctx.thumbnailBase64 = img.data;
            ctx.thumbnailMime = img.mime;
          }
        } catch {
          // Thumbnail fetch is optional.
        }
      }
    }
  } catch {
    // oEmbed failed; continue with whatever we have.
  }

  // 3) Best-effort description from the watch page.
  if (id) {
    try {
      const res = await fetchWithTimeout(
        `https://www.youtube.com/watch?v=${id}`,
        8000
      );
      if (res.ok) {
        const html = await res.text();
        const m =
          html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) ||
          html.match(/property="og:description"\s+content="([^"]*)"/i);
        if (m && m[1]) {
          ctx.description = m[1].replace(/&amp;/g, "&").trim();
        }
      }
    } catch {
      // Description scrape is optional.
    }
  }

  return ctx;
}
