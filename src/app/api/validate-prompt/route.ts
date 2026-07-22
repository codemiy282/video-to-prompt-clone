/**
 * POST /api/validate-prompt
 *
 * Score an AI-video prompt and return concrete, model-aware feedback so the
 * user can improve it before spending render credits.
 *
 * Body JSON: { prompt: string, model?: string }
 * Returns:   { success, score, criteria: [{name,rating,note}], suggestions: [] }
 */

import { validatePrompt, GeminiConfigError } from "../generate-prompt/gemini";
import { checkRateLimit } from "../generate-prompt/rate-limit";
import { MODEL_REGISTRY } from "@/lib/modelRegistry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VALID_IDS = new Set(MODEL_REGISTRY.map((m) => m.id));
const MAX_PROMPT = 6000;

interface Body {
  prompt?: string;
  model?: unknown;
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
  const rl = checkRateLimit(`validate:${clientIp(request)}`, 60_000, 8);
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

  const prompt = (body.prompt ?? "").toString().trim();
  if (!prompt) {
    return json({ success: false, error: "EMPTY_PROMPT", message: "A prompt is required." }, 400);
  }
  if (prompt.length > MAX_PROMPT) {
    return json(
      { success: false, error: "PROMPT_TOO_LONG", message: `Prompt must be ${MAX_PROMPT} characters or fewer.` },
      400
    );
  }

  const modelId =
    typeof body.model === "string" && VALID_IDS.has(body.model) ? body.model : undefined;

  try {
    const result = await validatePrompt(prompt, modelId);
    if (result.criteria.length === 0 && result.score === 0) {
      return json(
        { success: false, error: "REVIEW_FAILED", message: "Could not analyze this prompt. Try again." },
        502
      );
    }
    return json({ success: true, ...result }, 200);
  } catch (err) {
    if (err instanceof GeminiConfigError) {
      return json({ success: false, error: "GEMINI_CONFIG", message: err.message }, 500);
    }
    const message = err instanceof Error ? err.message : "Validation failed.";
    return json({ success: false, error: "VALIDATE_FAILED", message }, 500);
  }
}
