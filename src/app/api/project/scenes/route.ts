/**
 * POST /api/project/scenes
 *
 * Break a project idea into a structured list of scenes via Gemini. Returns
 * machine-parseable scenes the Project workspace stores and edits.
 *
 * Body JSON: { idea: string, count?: number }
 * Returns:   { success, scenes: RawScene[] }
 */

import { generateScenes, GeminiConfigError } from "../../generate-prompt/gemini";
import { checkRateLimit } from "../../generate-prompt/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_IDEA = 4000;

interface Body {
  idea?: string;
  count?: unknown;
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

  const countNum = Number(body.count);
  const count = Number.isFinite(countNum) ? countNum : 5;

  try {
    const scenes = await generateScenes(idea, count);
    if (scenes.length === 0) {
      return json(
        { success: false, error: "NO_SCENES", message: "Could not break this idea into scenes. Try rephrasing." },
        502
      );
    }
    return json({ success: true, scenes }, 200);
  } catch (err) {
    if (err instanceof GeminiConfigError) {
      return json({ success: false, error: "GEMINI_CONFIG", message: err.message }, 500);
    }
    const message = err instanceof Error ? err.message : "Scene generation failed.";
    return json({ success: false, error: "SCENES_FAILED", message }, 500);
  }
}
