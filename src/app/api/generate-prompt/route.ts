// POST /api/generate-prompt
// Accepts multipart/form-data with either:
//   - file + type ("video" | "image")   -> Gemini Files API analysis
//   - url  + type ("video")             -> YouTube context analysis
//   - text  + type ("text")             -> free-text storyboard generation
// Returns the certified contract shapes from docs/contracts/api-contracts.md.

import {
  analyzeFile,
  analyzeFrames,
  analyzeYouTube,
  generatePlatformPrompt,
  generateStoryboard,
  GeminiConfigError,
  MODEL,
} from "./gemini";
import { extractContext, parseVideoId } from "./youtube";
import { checkRateLimit } from "./rate-limit";
import { errorResponse, successResponse, type DetectedType } from "./types";
import { UPLOAD_MAX_BYTES, UPLOAD_MAX_LABEL } from "@/lib/uploadLimits";
import { classifyUpstream } from "./upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Upper bound on frames in one pack; the client sends FRAME_COUNT (8).
const MAX_FRAMES = 12;

const VIDEO_MAX_BYTES = UPLOAD_MAX_BYTES;
const IMAGE_MAX_BYTES = UPLOAD_MAX_BYTES;

const MIME_BY_EXT: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mpeg: "video/mpeg",
  mpg: "video/mpeg",
  flv: "video/x-flv",
  wmv: "video/x-ms-wmv",
  "3gp": "video/3gpp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

function mimeFromName(name: string): string {
  const ext = name.toLowerCase().split(".").pop() || "";
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") || "local";
}

export async function POST(request: Request): Promise<Response> {
  // 1) Rate limit.
  const rl = checkRateLimit(clientIp(request));
  if (!rl.ok) {
    return errorResponse(
      "RATE_LIMIT_EXCEEDED",
      "Too many requests. Please try again later.",
      429,
      true
    );
  }

  // 2) Parse multipart form.
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse("BAD_REQUEST", "Request body must be multipart/form-data.", 400, false);
  }

  const type = String(form.get("type") || "");
  if (type && type !== "video" && type !== "image" && type !== "text") {
    return errorResponse(
      "BAD_REQUEST",
      "Field 'type' must be 'video', 'image', or 'text'.",
      400,
      false
    );
  }

  const url = form.get("url");
  const file = form.get("file");
  const text = form.get("text");

  try {
    // 3a) YouTube URL mode.
    if (typeof url === "string" && url.trim().length > 0) {
      if (!parseVideoId(url)) {
        return errorResponse("INVALID_URL", "The provided YouTube URL is invalid.", 400, false);
      }
      const ctx = await extractContext(url);
      const prompt = await analyzeYouTube(ctx);
      return successResponse(prompt, "video", MODEL);
    }

    // 3b) Frame-pack mode: stills sampled from a video in the browser, sent
    // instead of the video itself so the platform body limit stops mattering.
    const frameParts = form.getAll("frames").filter((f): f is File => f instanceof File);
    if (frameParts.length > 0) {
      if (frameParts.length > MAX_FRAMES) {
        return errorResponse(
          "BAD_REQUEST",
          `At most ${MAX_FRAMES} frames may be sent.`,
          400,
          false
        );
      }
      const total = frameParts.reduce((sum, f) => sum + f.size, 0);
      if (total > UPLOAD_MAX_BYTES) {
        return errorResponse(
          "FILE_TOO_LARGE",
          `Frames must total ${UPLOAD_MAX_LABEL} or less.`,
          400,
          false
        );
      }
      const frames = await Promise.all(
        frameParts.map(async (f) => ({
          bytes: Buffer.from(await f.arrayBuffer()),
          mimeType: f.type || "image/jpeg",
        }))
      );
      const prompt = await analyzeFrames(frames);
      return successResponse(prompt, "video", MODEL);
    }

    // 3c) File upload mode.
    if (file instanceof File) {
      const detectedType: DetectedType = type === "image" ? "image" : "video";
      const max = detectedType === "video" ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
      if (file.size > max) {
        return errorResponse(
          "FILE_TOO_LARGE",
          `Files must be ${UPLOAD_MAX_LABEL} or smaller.`,
          400,
          false
        );
      }

      const mimeType = file.type || mimeFromName(file.name);
      const bytes = Buffer.from(await file.arrayBuffer());
      const prompt = await analyzeFile(bytes, mimeType, detectedType);
      return successResponse(prompt, detectedType, MODEL);
    }

    // 3d) Free-text mode with optional platform.
    if (typeof text === "string" && text.trim().length > 0) {
      const platform = form.get("platform");
      if (typeof platform === "string" && platform.trim().length > 0 && platform !== "storyboard") {
        const prompt = await generatePlatformPrompt(text, platform);
        return successResponse(prompt, "text", MODEL);
      }
      const prompt = await generateStoryboard(text);
      return successResponse(prompt, "text", MODEL);
    }

    return errorResponse(
      "BAD_REQUEST",
      "Provide a 'url' (YouTube link), a 'file' (video/image), or 'text' (script).",
      400,
      false
    );
  } catch (err) {
    // A missing/invalid key is an operator problem, not something the reader
    // can act on — log it and answer with the same opaque code as any other
    // upstream failure rather than echoing configuration details.
    if (err instanceof GeminiConfigError) {
      console.error("[generate-prompt] configuration error:", err.message);
      return errorResponse("SERVICE_ERROR", "The service is unavailable.", 503, false);
    }
    const { code, status, retryable } = classifyUpstream(err, "generate-prompt");
    return errorResponse(code, "The service is busy. Please try again.", status, retryable);
  }
}
