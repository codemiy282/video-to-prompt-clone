/**
 * POST /api/project/scenes
 *
 * Break a project idea into a structured list of scenes via Gemini. Returns
 * machine-parseable scenes the Project workspace stores and edits.
 *
 * Body JSON: { idea: string, count?: number }
 * Returns:   { success, scenes: RawScene[] }
 */

import {
  generateScenes,
  GeminiConfigError,
  type SceneBrief,
} from "../../generate-prompt/gemini";
import { scenesForDuration } from "@/lib/sceneCount";
import { checkRateLimit } from "../../generate-prompt/rate-limit";
import { classifyUpstream } from "../../generate-prompt/upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_IDEA = 4000;

const MAX_BRIEF_FIELD = 200;

interface Body {
  idea?: string;
  count?: unknown;
  brief?: unknown;
}

/** Trim an untrusted brief field to a short string, or drop it. */
function briefText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, MAX_BRIEF_FIELD);
  return trimmed || undefined;
}

/**
 * Narrow an untrusted brief. Unknown keys are dropped rather than forwarded:
 * every field ends up inside a model instruction, so only the ones we designed
 * for are allowed through.
 */
function readBrief(value: unknown): SceneBrief | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const seconds = Number(raw.durationSeconds);
  const brief: SceneBrief = {
    audience: briefText(raw.audience),
    platform: briefText(raw.platform),
    durationSeconds:
      Number.isFinite(seconds) && seconds > 0 ? Math.min(600, Math.round(seconds)) : undefined,
    tone: briefText(raw.tone),
    cta: briefText(raw.cta),
  };
  return Object.values(brief).some((v) => v !== undefined) ? brief : undefined;
}

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") || "local";
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(request: Request): Promise<Response> {
  const rl = checkRateLimit(`scenes:${clientIp(request)}`, 60_000, 6);
  if (!rl.ok) {
    return json(
      { success: false, error: "RATE_LIMIT", message: "Too many requests. Please try again later." },
      429
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return json({ success: false, error: "BAD_REQUEST", message: "Invalid JSON body." }, 400);
  }

  const idea = (body.idea ?? "").toString().trim();
  if (!idea) {
    return json({ success: false, error: "EMPTY_IDEA", message: "An idea is required." }, 400);
  }
  if (idea.length > MAX_IDEA) {
    return json(
      { success: false, error: "IDEA_TOO_LONG", message: `Idea must be ${MAX_IDEA} characters or fewer.` },
      400
    );
  }

  const brief = readBrief(body.brief);
  const countNum = Number(body.count);
  // An explicit count wins; otherwise a stated runtime implies one.
  const count = Number.isFinite(countNum)
    ? countNum
    : brief?.durationSeconds
      ? scenesForDuration(brief.durationSeconds)
      : 5;

  try {
    const scenes = await generateScenes(idea, count, brief);
    if (scenes.length === 0) {
      return json(
        { success: false, error: "SERVICE_ERROR", message: "Could not break this idea into scenes." },
        502
      );
    }
    return json({ success: true, scenes }, 200);
  } catch (err) {
    if (err instanceof GeminiConfigError) {
      console.error("[scenes] configuration error:", err.message);
      return json({ success: false, error: "SERVICE_ERROR", message: "The service is unavailable." }, 503);
    }
    const { code, status } = classifyUpstream(err, "scenes");
    return json({ success: false, error: code, message: "The service is busy. Please try again." }, status);
  }
}
