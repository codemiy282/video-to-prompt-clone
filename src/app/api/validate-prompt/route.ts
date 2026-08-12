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
import { classifyUpstream } from "../generate-prompt/upstream";
import { resolveLocale } from "@/i18n/config";
import { MODEL_REGISTRY } from "@/lib/modelRegistry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VALID_IDS = new Set(MODEL_REGISTRY.map((m) => m.id));
const MAX_PROMPT = 6000;

interface Body {
  prompt?: string;
  model?: unknown;
  lang?: unknown;
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

  // An unrecognised id used to fall through to "no target model", so a typo
  // silently produced a generic review while the caller believed they were
  // validating against Veo. Say so instead.
  if (body.model !== undefined && !(typeof body.model === "string" && VALID_IDS.has(body.model))) {
    return json(
      {
        success: false,
        error: "UNKNOWN_MODEL",
        message: `Unknown model id. Valid ids: ${MODEL_REGISTRY.map((m) => m.id).join(", ")}.`,
      },
      400
    );
  }
  const modelId = typeof body.model === "string" ? body.model : undefined;

  try {
    const result = await validatePrompt(prompt, modelId, resolveLocale(body.lang));
    if (result.criteria.length === 0 && result.score === 0) {
      return json(
        { success: false, error: "SERVICE_ERROR", message: "Could not analyze this prompt." },
        502
      );
    }
    return json({ success: true, ...result }, 200);
  } catch (err) {
    if (err instanceof GeminiConfigError) {
      console.error("[validate] configuration error:", err.message);
      return json({ success: false, error: "SERVICE_ERROR", message: "The service is unavailable." }, 503);
    }
    const { code, status } = classifyUpstream(err, "validate");
    return json({ success: false, error: code, message: "The service is busy. Please try again." }, status);
  }
}
