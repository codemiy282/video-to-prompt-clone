// Pull representative still frames out of a video, entirely in the browser.
//
// Why this exists: Vercel rejects request bodies over ~4.5 MB before our route
// runs (see uploadLimits.ts), which rules out uploading a real video. Sampling
// a handful of frames turns a 200 MB file into well under a megabyte of JPEG,
// so length and file size stop mattering. The original never leaves the user's
// machine, which is also the better privacy answer for footage that may show
// faces or unreleased work.
//
// The trade-off is real and worth stating plainly: stills carry no audio and no
// motion between them. A frame pack tells the model what the video looks like,
// not what it sounds like or how the camera moves.

/** How many frames to sample. Enough to cover a short-form video's beats. */
export const FRAME_COUNT = 8;

/** Longest edge of an extracted frame. Detail past this buys nothing here. */
const MAX_EDGE = 768;

/** JPEG quality — visually fine for description, roughly 60-100 KB a frame. */
const JPEG_QUALITY = 0.7;

/** Give up on a seek that never lands rather than hanging the page. */
const SEEK_TIMEOUT_MS = 10_000;

export interface Keyframe {
  blob: Blob;
  /** Position in the source video, seconds. */
  time: number;
}

export class KeyframeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KeyframeError";
  }
}

function onceEvent(el: HTMLElement, name: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new KeyframeError(`Timed out waiting for "${name}".`));
    }, timeoutMs);
    function cleanup() {
      clearTimeout(timer);
      el.removeEventListener(name, onOk);
      el.removeEventListener("error", onErr);
    }
    function onOk() {
      cleanup();
      resolve();
    }
    function onErr() {
      cleanup();
      reject(new KeyframeError("The browser could not decode this video."));
    }
    el.addEventListener(name, onOk, { once: true });
    el.addEventListener("error", onErr, { once: true });
  });
}

/**
 * Recover a duration the container didn't declare.
 *
 * WebM written by MediaRecorder — screen recorders, browser capture tools, a
 * lot of Android output — has no duration in its header, so `video.duration`
 * reads Infinity until the file has been played through. Seeking far past the
 * end forces the browser to scan for the real end and fire `durationchange`,
 * after which the value is correct. Without this, every such file was rejected
 * as unreadable.
 */
async function resolveDuration(video: HTMLVideoElement): Promise<number> {
  if (Number.isFinite(video.duration) && video.duration > 0) return video.duration;

  await new Promise<void>((resolve) => {
    const timer = setTimeout(finish, SEEK_TIMEOUT_MS);
    function onChange() {
      if (Number.isFinite(video.duration)) finish();
    }
    function finish() {
      clearTimeout(timer);
      video.removeEventListener("durationchange", onChange);
      resolve();
    }
    video.addEventListener("durationchange", onChange);
    // Any value beyond a plausible runtime works; this is the conventional one.
    video.currentTime = 1e101;
  });

  // Park the playhead somewhere valid, and wait for that seek to land. Leaving
  // it in flight would let its `seeked` event satisfy the first frame's wait in
  // the extraction loop, capturing t=0 instead of the requested timestamp.
  video.currentTime = 0;
  await onceEvent(video, "seeked", SEEK_TIMEOUT_MS).catch(() => {
    // A browser that never confirms this seek still seeks correctly for the
    // real samples below; don't fail the whole extraction over the parking.
  });
  return video.duration;
}

/** Fit within MAX_EDGE without upscaling or changing aspect ratio. */
function scaledSize(w: number, h: number): { w: number; h: number } {
  const longest = Math.max(w, h);
  if (longest <= MAX_EDGE) return { w, h };
  const ratio = MAX_EDGE / longest;
  return { w: Math.round(w * ratio), h: Math.round(h * ratio) };
}

/**
 * Sample timestamps evenly across the video, staying just inside both ends.
 * The very first frame is often black and the very last often lands past the
 * final decodable frame, so both are avoided.
 */
function sampleTimes(duration: number, count: number): number[] {
  const start = duration * 0.02;
  const end = duration * 0.98;
  const span = end - start;
  if (count === 1) return [start + span / 2];
  return Array.from({ length: count }, (_, i) => start + (span * i) / (count - 1));
}

export interface ExtractOptions {
  count?: number;
  /** Called after each frame so the UI can show progress. */
  onProgress?: (done: number, total: number) => void;
  signal?: AbortSignal;
}

/**
 * Decode `file` and return `count` evenly spaced JPEG frames.
 *
 * Throws KeyframeError when the browser cannot decode the file or a seek never
 * completes — callers should surface that rather than silently uploading.
 */
export async function extractKeyframes(
  file: File,
  { count = FRAME_COUNT, onProgress, signal }: ExtractOptions = {}
): Promise<Keyframe[]> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  // Muted + playsInline keeps mobile browsers from refusing to load frames.
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  try {
    await onceEvent(video, "loadedmetadata", SEEK_TIMEOUT_MS);

    const duration = await resolveDuration(video);
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new KeyframeError("This video does not report a usable duration.");
    }

    const { w, h } = scaledSize(video.videoWidth, video.videoHeight);
    if (w === 0 || h === 0) {
      throw new KeyframeError("This video has no decodable picture.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new KeyframeError("Canvas is unavailable in this browser.");

    const times = sampleTimes(duration, count);
    const frames: Keyframe[] = [];

    for (const time of times) {
      if (signal?.aborted) throw new KeyframeError("Cancelled.");
      video.currentTime = time;
      await onceEvent(video, "seeked", SEEK_TIMEOUT_MS);
      ctx.drawImage(video, 0, 0, w, h);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
      );
      // A single unencodable frame shouldn't sink the whole pack.
      if (blob) frames.push({ blob, time });
      onProgress?.(frames.length, times.length);
    }

    if (frames.length === 0) {
      throw new KeyframeError("No frames could be read from this video.");
    }
    return frames;
  } finally {
    // Release the decoder and the blob URL even if we threw.
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

/** Human-readable timestamp for a frame, e.g. "0:07". */
export function formatTime(seconds: number): string {
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
