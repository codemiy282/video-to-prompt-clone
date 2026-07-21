/**
 * POST /api/convert-prompt
 *
 * Nhận MỘT ý tưởng/prompt gốc + danh sách model đích, biên dịch thành prompt
 * riêng cho từng model (dựa trên capability trong modelRegistry.ts) + kèm cảnh
 * báo capability (vd model không có audio nhưng prompt nhắc tới âm thanh).
 *
 * Body JSON: { prompt: string, models: string[], inputMode: "text" | "image" }
 * Trả về:   { success, results: [{ model, prompt, warnings: string[] }] }
 */

import { convertToModelPrompt, GeminiConfigError } from "../generate-prompt/gemini";
import { checkRateLimit } from "../generate-prompt/rate-limit";
import {
  MODEL_REGISTRY,
  getModel,
  capabilityWarnings,
  type InputMode,
} from "@/lib/modelRegistry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VALID_IDS = new Set(MODEL_REGISTRY.map((m) => m.id));
const MAX_PROMPT = 4000;

interface Body {
  prompt?: string;
  models?: unknown;
  inputMode?: string;
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
  // Rate limit: các call này gọi Gemini nên giữ chặt hơn.
  const rl = checkRateLimit(`convert:${clientIp(request)}`, 60_000, 6);
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

  const inputMode: InputMode = body.inputMode === "image" ? "image" : "text";

  const requested = Array.isArray(body.models) ? body.models.map(String) : [];
  const models = requested.filter((id) => VALID_IDS.has(id));
  // Không chọn model nào -> mặc định tất cả.
  const targets = models.length > 0 ? models : MODEL_REGISTRY.map((m) => m.id);

  try {
    const results = await Promise.all(
      targets.map(async (id) => {
        const meta = getModel(id)!;
        const tailored = await convertToModelPrompt(prompt, id, inputMode);
        return {
          model: id,
          name: meta.name,
          prompt: tailored,
          warnings: capabilityWarnings(meta, prompt, inputMode),
        };
      })
    );
    return json({ success: true, results }, 200);
  } catch (err) {
    if (err instanceof GeminiConfigError) {
      return json({ success: false, error: "GEMINI_CONFIG", message: err.message }, 500);
    }
    const message = err instanceof Error ? err.message : "Conversion failed.";
    return json({ success: false, error: "CONVERT_FAILED", message }, 500);
  }
}
