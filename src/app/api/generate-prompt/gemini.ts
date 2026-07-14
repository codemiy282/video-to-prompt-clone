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

const PLATFORM_PROMPTS: Record<string, string> = {
  kling:
    "You are a Kling AI prompt expert. Transform the idea below into a detailed prompt optimized for Kling AI video generation. Focus on cinematic camera moves, tracking shots, consistent character motion, and realistic 1080p text-to-video output. Include visual style, lighting, color palette, and camera positioning.",
  runway:
    "You are a Runway prompt expert. Transform the idea below into a detailed prompt optimized for Runway Gen-3 and Gen-4. Focus on cinematographic direction, volumetric lighting, color-grading cues, camera angles, and visual effects. Include atmosphere, texture details, and motion style.",
  seedance:
    "You are a Seedance prompt expert. Transform the idea below into a detailed prompt optimized for ByteDance Seedance. Focus on shot-by-shot framing, smooth multi-shot motion, stable subjects, and native cinematic framing. Include scene transitions and temporal coherence.",
  veo: "You are a Veo 3 prompt expert. Transform the idea below into a detailed prompt optimized for Google Veo 3. Include scene descriptions, camera movements, and synchronized audio cues — dialogue, sound effects, and music. Leverage Veo 3's native sound generation capabilities.",
  storyboard:
    "You are a storyboard expert. Transform the script or idea below into a scene-by-scene storyboard breakdown. For each scene, describe the shot type, camera angle, composition, action, and key visual elements. Format each scene clearly.",
};

export async function generatePlatformPrompt(
  description: string,
  platform: string
): Promise<string> {
  const key = getApiKey();
  const genAI = new GoogleGenerativeAI(key);

  const systemText =
    PLATFORM_PROMPTS[platform] ||
    "You are an expert prompt engineer. Transform the idea below into a detailed, well-crafted prompt for AI video generation. Focus on visual style, camera movements, lighting, mood, and composition.";

  const systemInstruction: Content = {
    role: "user",
    parts: [{ text: systemText }],
  };
  const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: `User's idea:\n${description}\n\nGenerate a single, detailed prompt (no explanations, no prefixes):` },
        ],
      },
    ],
  });

  return result.response.text();
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
