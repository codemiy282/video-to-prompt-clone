/**
 * POST /api/feedback
 *
 * Nhận feedback / feature request / bug report từ cộng đồng.
 *
 * Giao hàng ($0): nếu có env FEEDBACK_DISCORD_WEBHOOK (webhook Discord miễn phí)
 * thì đẩy tin nhắn vào kênh Discord của bạn. Nếu KHÔNG cấu hình, vẫn nhận và ghi
 * log server (xem trong Vercel logs) rồi trả success — UX không bao giờ vỡ.
 *
 * Tạo webhook Discord miễn phí: Server Settings → Integrations → Webhooks.
 */

import { checkRateLimit } from "@/app/api/generate-prompt/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = new Set(["feedback", "feature", "bug"]);
const MAX_MESSAGE = 2000;
const MAX_NAME = 100;
const MAX_EMAIL = 200;
const WEBHOOK_TIMEOUT_MS = 8000;

interface FeedbackBody {
  type?: string;
  message?: string;
  name?: string;
  email?: string;
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

async function deliverToDiscord(text: string): Promise<boolean> {
  const webhook = process.env.FEEDBACK_DISCORD_WEBHOOK;
  if (!webhook) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // Discord cắt content ở 2000 ký tự.
      body: JSON.stringify({ content: text.slice(0, 2000) }),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: Request): Promise<Response> {
  // Rate limit: tối đa 5 feedback / phút / IP.
  const rl = checkRateLimit(`feedback:${clientIp(request)}`, 60_000, 5);
  if (!rl.ok) {
    return json(
      { success: false, error: "RATE_LIMIT", message: "Too many submissions. Please try again later." },
      429
    );
  }

  let body: FeedbackBody;
  try {
    body = (await request.json()) as FeedbackBody;
  } catch {
    return json({ success: false, error: "BAD_REQUEST", message: "Invalid JSON body." }, 400);
  }

  const type = TYPES.has(String(body.type)) ? String(body.type) : "feedback";
  const message = (body.message ?? "").toString().trim();
  const name = (body.name ?? "").toString().trim().slice(0, MAX_NAME);
  const email = (body.email ?? "").toString().trim().slice(0, MAX_EMAIL);

  if (!message) {
    return json({ success: false, error: "EMPTY_MESSAGE", message: "Message is required." }, 400);
  }
  if (message.length > MAX_MESSAGE) {
    return json(
      { success: false, error: "MESSAGE_TOO_LONG", message: `Message must be ${MAX_MESSAGE} characters or fewer.` },
      400
    );
  }

  const label = type === "feature" ? "💡 Feature request" : type === "bug" ? "🐞 Bug report" : "💬 Feedback";
  const lines = [
    `**${label}**`,
    name ? `From: ${name}${email ? ` <${email}>` : ""}` : email ? `From: <${email}>` : null,
    "",
    message,
  ].filter((l): l is string => l !== null);
  const text = lines.join("\n");

  const delivered = await deliverToDiscord(text);
  if (!delivered) {
    // Không có webhook (hoặc gửi lỗi) -> vẫn ghi nhận để không mất UX.
    console.log(`[feedback:${type}] ${name || "anon"}${email ? ` <${email}>` : ""}: ${message.slice(0, 200)}`);
  }

  return json({ success: true, delivered }, 200);
}
