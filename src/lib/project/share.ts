// Read-only share links, with no server involved.
//
// There is no backend to host a shared project, so the project travels inside
// the link itself: gzip, then base64url, in the URL fragment. The fragment is
// never sent to the server by the browser, so a shared storyboard stays as
// private as the link.
//
// The cost is length. A link is a fine way to pass around a brief and a shot
// list; a project whose scenes all carry generated prompts will blow past what
// chat apps and mail clients keep intact, so callers must handle
// ShareTooLargeError and point the user at the .json export instead.

import type { Project } from "./types";

/**
 * Practical ceiling for a URL that survives being pasted around.
 *
 * Browsers themselves allow far more, but messaging apps, mail clients and
 * link previewers truncate well before their limits. 8000 characters is the
 * commonly cited safe bound for the whole URL.
 */
const MAX_URL_LENGTH = 8000;

export const SHARE_PARAM = "s";

export class ShareTooLargeError extends Error {
  constructor(readonly length: number) {
    super(`Share link would be ${length} characters.`);
    this.name = "ShareTooLargeError";
  }
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function gzip(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzip(bytes: Uint8Array): Promise<string> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(
    new DecompressionStream("gzip")
  );
  return new Response(stream).text();
}

/**
 * Fields worth carrying in a link. Timestamps and ids are dropped: the reader
 * gets a fresh copy if they save it, and every byte saved is link length.
 */
function shareable(project: Project) {
  return {
    t: project.title,
    i: project.idea,
    b: project.brief,
    m: project.targetModel,
    n: project.inputMode,
    l: project.bibles,
    s: project.scenes,
  };
}

/** Build a read-only link for `project`. Throws ShareTooLargeError if oversized. */
export async function buildShareLink(project: Project, origin: string): Promise<string> {
  const packed = toBase64Url(await gzip(JSON.stringify(shareable(project))));
  const url = `${origin}/projects#${SHARE_PARAM}=${packed}`;
  if (url.length > MAX_URL_LENGTH) throw new ShareTooLargeError(url.length);
  return url;
}

/** Decode a project from a location hash, or null if there isn't a valid one. */
export async function readShareLink(hash: string): Promise<Project | null> {
  const match = hash.replace(/^#/, "").match(new RegExp(`(?:^|&)${SHARE_PARAM}=([^&]+)`));
  if (!match) return null;
  try {
    const raw = JSON.parse(await gunzip(fromBase64Url(match[1])));
    if (!raw || typeof raw !== "object") return null;
    const now = new Date().toISOString();
    return {
      id: "shared",
      title: typeof raw.t === "string" ? raw.t : "Shared project",
      idea: typeof raw.i === "string" ? raw.i : "",
      brief: raw.b,
      targetModel: typeof raw.m === "string" ? raw.m : "veo",
      inputMode: raw.n === "image" ? "image" : "text",
      bibles: Array.isArray(raw.l) ? raw.l : [],
      scenes: Array.isArray(raw.s) ? raw.s : [],
      createdAt: now,
      updatedAt: now,
    };
  } catch {
    // Truncated or tampered link — treat as absent rather than erroring.
    return null;
  }
}

/** Whether this browser can build share links at all. */
export function shareSupported(): boolean {
  return typeof CompressionStream !== "undefined";
}
