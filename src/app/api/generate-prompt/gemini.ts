// Gemini connector: file uploads via the Files API and prompt synthesis via
// gemini-2.5-flash. Reads the API key exclusively from process.env so it is
// never exposed to the client.

import {
  GoogleGenerativeAI,
  type Content,
  type Part,
} from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import type { DetectedType } from "./types";
import { getModel, type InputMode } from "@/lib/modelRegistry";

export const MODEL = "gemini-2.5-flash";

export class GeminiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiConfigError";
  }
}

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new GeminiConfigError(
      "The server is missing the GEMINI_API_KEY. Add it to .env.local and restart the server."
    );
  }
  return key;
}

const SYSTEM_PROMPT = `You are an expert prompt engineer for AI video and image generation models (Runway, Kling, Seedance, Veo, Midjourney, Stable Diffusion, and similar).

Your task: examine the provided media and write a single, highly detailed, ready-to-use generation prompt that faithfully captures what the media shows.

Guidelines:
- Be concrete and cinematic: describe subject, composition, camera movement, lens, lighting, color palette, mood, style, and any notable motion.
- Use precise, descriptive language and avoid vague filler.
- Write the prompt as one coherent paragraph (or a tightly structured bullet list when it improves clarity).
- Do not explain your reasoning, do not mention the source media, and do not add disclaimers. Output only the prompt.`;

function userInstruction(kind: DetectedType): string {
  if (kind === "image") {
    return "This is an image. Describe it as a detailed AI image-generation prompt.";
  }
  return "This is a video. Describe it as a detailed AI video-generation prompt, including any camera motion and scene changes you can infer.";
}

export interface YouTubeContext {
  url: string;
  title?: string;
  author?: string;
  description?: string;
  thumbnailBase64?: string;
  thumbnailMime?: string;
}

function youtubeInstruction(ctx: YouTubeContext): string {
  const lines: string[] = [];
  lines.push(
    "Generate a detailed AI video-generation prompt for the YouTube video described below."
  );
  if (ctx.title) lines.push(`Video title: ${ctx.title}`);
  if (ctx.author) lines.push(`Channel: ${ctx.author}`);
  if (ctx.description) {
    const trimmed = ctx.description.slice(0, 2000);
    lines.push(`Description: ${trimmed}`);
  }
  lines.push(
    "Use the title/description and the provided thumbnail frame to infer the visual style, subject, and mood. Output only the prompt."
  );
  return lines.join("\n");
}

async function waitForActive(
  fileManager: GoogleAIFileManager,
  name: string,
  timeoutMs: number
): Promise<void> {
  const start = Date.now();
  const interval = 2000;
  while (Date.now() - start < timeoutMs) {
    const meta = await fileManager.getFile(name);
    if (meta.state === "ACTIVE") return;
    if (meta.state === "FAILED") {
      throw new Error("The uploaded file failed to process on the Gemini File API.");
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error("Timed out waiting for the uploaded file to become ready.");
}

export async function analyzeFile(
  bytes: Buffer,
  mimeType: string,
  kind: DetectedType
): Promise<string> {
  const key = getApiKey();
  const fileManager = new GoogleAIFileManager(key);
  const genAI = new GoogleGenerativeAI(key);

  const upload = await fileManager.uploadFile(bytes, {
    mimeType,
    displayName: `${kind}-${Date.now()}`,
  });
  const file = upload.file;

  try {
    await waitForActive(fileManager, file.name, 60_000);

    const systemInstruction: Content = {
      role: "user",
      parts: [{ text: SYSTEM_PROMPT }],
    };
    const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction });

    const parts: Part[] = [
      { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
      { text: userInstruction(kind) },
    ];

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
    });

    return result.response.text();
  } finally {
    try {
      await fileManager.deleteFile(file.name);
    } catch {
      // Best-effort cleanup; ignore failures.
    }
  }
}

const STORYBOARD_SYSTEM_PROMPT = `You are a professional storyboard artist and film director. Given a story or script, break it into a clear sequence of storyboard scenes suitable for video/animation production.

For each scene provide:
- Scene number and a concise one-line logline.
- Visual description (subjects, setting, composition).
- Shot type and camera movement (e.g. wide, close-up, pan, tracking).
- Key action happening in the scene.
- Mood, lighting, and color notes.

Output a clean, numbered storyboard list only. Do not add commentary outside the storyboard.`;

export async function generateStoryboard(script: string): Promise<string> {
  const key = getApiKey();
  const genAI = new GoogleGenerativeAI(key);

  const systemInstruction: Content = {
    role: "user",
    parts: [{ text: STORYBOARD_SYSTEM_PROMPT }],
  };
  const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: `Story / script:\n${script}` }] }],
  });

  return result.response.text();
}

interface PlatformSpec {
  display: string;
  system: string;
  format: string;
}

// Each video platform expects a different prompt shape, so every call is
// explicitly tagged with its target platform (e.g. "CHO NỀN TẢNG Veo 3").
const PLATFORMS: Record<string, PlatformSpec> = {
  veo: {
    display: "Veo 3",
    system:
      "You are an elite prompt engineer specialized in Google Veo 3. You write production-ready, cinematic text-to-video prompts that fully exploit Veo 3's capabilities.",
    format:
      "Emphasize scene descriptions, camera movement, and synchronized audio cues (dialogue, sound effects, and music) because Veo 3 generates native sound. Keep the prompt coherent and shot-focused.",
  },
  runway: {
    display: "Runway",
    system:
      "You are an elite prompt engineer specialized in Runway Gen-3 and Gen-4. You write production-ready, cinematic text-to-video prompts that fully exploit Runway's capabilities.",
    format:
      "Emphasize cinematographic direction, volumetric lighting, color-grading cues, camera angles, and visual effects. Include atmosphere, texture details, and motion style.",
  },
  kling: {
    display: "Kling AI",
    system:
      "You are an elite prompt engineer specialized in Kling AI. You write production-ready, cinematic text-to-video prompts that fully exploit Kling's capabilities.",
    format:
      "Emphasize cinematic camera moves, tracking shots, consistent character motion, and realistic 1080p text-to-video output. Include visual style, lighting, color palette, and camera positioning.",
  },
  seedance: {
    display: "Seedance",
    system:
      "You are an elite prompt engineer specialized in ByteDance Seedance. You write production-ready, cinematic text-to-video prompts that fully exploit Seedance's capabilities.",
    format:
      "Emphasize shot-by-shot framing, smooth multi-shot motion, stable subjects, and native cinematic framing. Include scene transitions and temporal coherence.",
  },
};

export async function generatePlatformPrompt(
  description: string,
  platform: string
): Promise<string> {
  const key = getApiKey();
  const genAI = new GoogleGenerativeAI(key);

  const spec = PLATFORMS[platform];
  const systemText =
    spec?.system ??
    "You are an expert prompt engineer. Transform the idea below into a detailed, well-crafted prompt for AI video generation. Focus on visual style, camera movements, lighting, mood, and composition.";

  const display = spec?.display ?? platform;

  const lines = [
    `Tạo một prompt chi tiết và sẵn sàng sử dụng CHO NỀN TẢNG ${display}, dựa trên nội dung sau:`,
    "",
    description,
  ];
  if (spec?.format) {
    lines.push("", spec.format);
  }
  lines.push(
    "",
    "Chỉ trả về duy nhất prompt (viết bằng tiếng Anh), không giải thích, không thêm tiền tố hay lời giới thiệu."
  );

  const systemInstruction: Content = {
    role: "user",
    parts: [{ text: systemText }],
  };
  const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: lines.join("\n") }],
      },
    ],
  });

  return result.response.text();
}

// Structured scene breakdown for the Project spine. Unlike generateStoryboard
// (free text), this returns machine-parseable scenes the workspace can store
// and edit individually.
export interface RawScene {
  heading: string;
  description: string;
  shotType?: string;
  cameraMove?: string;
  mood?: string;
}

// A delimited plain-text format (not JSON) is used deliberately: model-written
// visual descriptions routinely contain quotes, colons, and stray punctuation
// that break JSON parsing. Labelled blocks are immune to escaping issues.
const SCENES_SYSTEM_PROMPT = `You are a professional film director and storyboard artist. Break the user's idea into a sequence of distinct video scenes suitable for AI video generation.

Output EACH scene as a block in EXACTLY this format, and nothing else:

[SCENE]
HEADING: <a short one-line logline>
DESCRIPTION: <a concrete visual description: subject, setting, composition, action — one line>
SHOT: <e.g. wide, close-up, medium, aerial>
CAMERA: <e.g. static, slow push-in, pan left, tracking>
MOOD: <lighting/color/emotional tone in a few words>

Separate scenes with a blank line. Do not number scenes. Do not add any commentary, headings, or markdown before or after the blocks. Write in English.`;

const SCENE_LABELS = ["HEADING", "DESCRIPTION", "SHOT", "CAMERA", "MOOD"];

// Extract a labelled field from a scene block, tolerating multi-line values by
// reading up to the next known label (or end of block).
function fieldOf(block: string, label: string): string {
  const re = new RegExp(
    `${label}\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*(?:${SCENE_LABELS.join("|")})\\s*:|$)`,
    "i"
  );
  const m = block.match(re);
  return m ? m[1].trim().replace(/\s+/g, " ") : "";
}

function parseScenesText(text: string): RawScene[] {
  return text
    .split(/\[SCENE\]/i)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((block) => ({
      heading: fieldOf(block, "HEADING"),
      description: fieldOf(block, "DESCRIPTION"),
      shotType: fieldOf(block, "SHOT") || undefined,
      cameraMove: fieldOf(block, "CAMERA") || undefined,
      mood: fieldOf(block, "MOOD") || undefined,
    }))
    .filter((s) => s.description || s.heading)
    .slice(0, 8);
}

export async function generateScenes(
  idea: string,
  count = 5
): Promise<RawScene[]> {
  const key = getApiKey();
  const genAI = new GoogleGenerativeAI(key);

  const target = Math.min(8, Math.max(3, count));
  const systemInstruction: Content = {
    role: "user",
    parts: [{ text: SCENES_SYSTEM_PROMPT }],
  };
  const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Idea:\n${idea}\n\nBreak this into about ${target} scenes using the [SCENE] block format.`,
          },
        ],
      },
    ],
  });

  return parseScenesText(result.response.text());
}

// Registry-driven prompt conversion: takes one universal idea and compiles it
// into a model-specific prompt using the capabilities in modelRegistry.ts —
// so model claims live in ONE place, not scattered/hard-coded here.
export async function convertToModelPrompt(
  base: string,
  modelId: string,
  inputMode: InputMode
): Promise<string> {
  const key = getApiKey();
  const genAI = new GoogleGenerativeAI(key);

  const m = getModel(modelId);
  const name = m?.name ?? modelId;
  const versionLabel = m?.version ? ` (${m.version})` : "";
  const guidance = m?.promptGuidance ?? "";

  const audioLine = m?.audio
    ? "This model supports native audio — you MAY include audio cues (dialogue, sound effects, music)."
    : "This model has NO native audio — do NOT include audio/sound/music cues; describe visuals only.";

  const modeLine =
    inputMode === "image"
      ? "This is an IMAGE-TO-VIDEO prompt: focus on MOTION and camera movement. Do NOT re-describe static elements already visible in the source image."
      : "This is a TEXT-TO-VIDEO prompt: describe the full scene, subject, style, lighting, and camera.";

  const systemText = [
    `You are an elite prompt engineer specialized in ${name}${versionLabel}.`,
    `Rewrite the user's idea into a single, production-ready ${name} prompt.`,
    audioLine,
    modeLine,
    guidance ? `Platform guidance: ${guidance}` : "",
    "Output ONLY the final prompt in English — no preamble, no explanation, no labels or quotes.",
  ]
    .filter(Boolean)
    .join("\n");

  const systemInstruction: Content = {
    role: "user",
    parts: [{ text: systemText }],
  };
  const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: `Idea:\n${base}` }] }],
  });

  return result.response.text().trim();
}

export async function analyzeYouTube(ctx: YouTubeContext): Promise<string> {
  const key = getApiKey();
  const genAI = new GoogleGenerativeAI(key);

  const parts: Part[] = [{ text: youtubeInstruction(ctx) }];
  if (ctx.thumbnailBase64 && ctx.thumbnailMime) {
    parts.push({ inlineData: { mimeType: ctx.thumbnailMime, data: ctx.thumbnailBase64 } });
  }

  const systemInstruction: Content = {
    role: "user",
    parts: [{ text: SYSTEM_PROMPT }],
  };
  const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction });

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
  });

  return result.response.text();
}
