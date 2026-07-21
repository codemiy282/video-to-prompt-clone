/**
 * Model Capability Registry — single source of truth
 *
 * Toàn bộ thông tin về các model video AI (Kling/Veo/Runway/Seedance) được tập
 * trung Ở ĐÂY, thay vì rải rác (và lỗi thời) trong text từng trang. Prompt
 * compiler / UI sau này đọc từ registry này qua capability flags.
 *
 * ⚠️ Model video AI thay đổi RẤT nhanh (đổi tên, đổi version, thêm/bớt tính
 * năng). Vì vậy:
 *  - Mỗi model có `lastUpdated` (ngày maintainer cập nhật) + `docsUrl` (nguồn
 *    chính thức để đối chiếu).
 *  - Chỉ khẳng định các capability độ tin cậy CAO; số liệu dễ đổi (thời lượng,
 *    độ phân giải) để dạng khoảng/tham khảo và luôn kèm "xem docs".
 *  - UI hiển thị đĩa disclaimer nhắc người dùng đối chiếu docs chính thức.
 */

export type InputMode = "text" | "image";

export interface ModelCapability {
  id: string;
  name: string;
  vendor: string;
  /** Nhãn version hiện hành — có thể đổi; đừng hard-code ở nơi khác. */
  version: string;
  inputModes: InputMode[];
  /** Sinh audio gốc (thoại/SFX/nhạc) ngay trong model. */
  audio: boolean;
  /** Điều kiện hoá bằng khung hình đầu (start frame / image-to-video). */
  firstFrame: boolean;
  /** Điều kiện hoá bằng khung hình cuối (end frame). */
  lastFrame: boolean;
  /** Nhận ảnh tham chiếu (style/subject reference). */
  referenceImage: boolean;
  /** Có điều khiển camera (pan/zoom/quỹ đạo). */
  cameraControls: boolean;
  aspectRatios: string[];
  /** Chuỗi mô tả thời lượng (dạng tham khảo). */
  duration: string;
  /** Lời khuyên viết prompt cho model này. */
  promptGuidance: string;
  limitations: string[];
  /** Ngày maintainer cập nhật mục này (ISO). */
  lastUpdated: string;
  docsUrl: string;
}

export const MODEL_REGISTRY: ModelCapability[] = [
  {
    id: "veo",
    name: "Google Veo 3",
    vendor: "Google DeepMind",
    version: "Veo 3",
    inputModes: ["text", "image"],
    audio: true,
    firstFrame: true,
    lastFrame: false,
    referenceImage: false,
    cameraControls: true,
    aspectRatios: ["16:9", "9:16"],
    duration: "Short clips (~8s) — see docs",
    promptGuidance:
      "Describe the scene, camera moves, and audio cues — dialogue, sound effects, and music. Veo can generate synchronized native audio, so specify what should be heard, not only what is seen.",
    limitations: [
      "Clip length is short — plan multi-shot sequences.",
      "Exact limits and availability vary by region and tier.",
    ],
    lastUpdated: "2026-07-21",
    docsUrl: "https://deepmind.google/models/veo/",
  },
  {
    id: "kling",
    name: "Kling AI",
    vendor: "Kuaishou",
    version: "Kling",
    inputModes: ["text", "image"],
    audio: false,
    firstFrame: true,
    lastFrame: true,
    referenceImage: true,
    cameraControls: true,
    aspectRatios: ["16:9", "9:16", "1:1"],
    duration: "~5–10s typical — see docs",
    promptGuidance:
      "Kling supports start- and end-frame conditioning plus camera movement. Describe subject motion and the camera path, and keep the character/subject consistent across shots.",
    limitations: ["Feature availability differs between Kling versions and tiers."],
    lastUpdated: "2026-07-21",
    docsUrl: "https://klingai.com/",
  },
  {
    id: "runway",
    name: "Runway",
    vendor: "Runway",
    version: "Gen-4.5",
    inputModes: ["text", "image"],
    audio: false,
    firstFrame: true,
    lastFrame: false,
    referenceImage: true,
    cameraControls: true,
    aspectRatios: ["16:9", "9:16", "1:1"],
    duration: "~5–10s typical — see docs",
    promptGuidance:
      "For image-to-video, focus the prompt on MOTION and camera — do not re-describe what is already in the image. For text-to-video, describe scene, style, and camera direction.",
    limitations: [
      "Model names/versions change frequently — confirm the current model in-app.",
      "No native audio generation.",
    ],
    lastUpdated: "2026-07-21",
    docsUrl: "https://docs.runwayml.com/",
  },
  {
    id: "seedance",
    name: "Seedance",
    vendor: "ByteDance",
    version: "Seedance",
    inputModes: ["text", "image"],
    audio: false,
    firstFrame: true,
    lastFrame: false,
    referenceImage: false,
    cameraControls: true,
    aspectRatios: ["16:9", "9:16"],
    duration: "~5–10s typical — see docs",
    promptGuidance:
      "Seedance handles smooth multi-shot motion with stable subjects. Describe shot-by-shot action and native cinematic framing.",
    limitations: ["Availability and exact specs vary by platform/integration."],
    lastUpdated: "2026-07-21",
    docsUrl: "https://seed.bytedance.com/",
  },
];

/** Các capability boolean để render lưới so sánh (thứ tự cố định). */
export const CAPABILITY_KEYS = [
  "audio",
  "firstFrame",
  "lastFrame",
  "referenceImage",
  "cameraControls",
] as const;

export type CapabilityKey = (typeof CAPABILITY_KEYS)[number];

export function getModel(id: string): ModelCapability | undefined {
  return MODEL_REGISTRY.find((m) => m.id === id);
}

// Mã cảnh báo (client map sang chuỗi đã localize qua convert.warn.<code>).
export type WarningCode = "noAudio" | "imageMotion" | "noImageInput";

const AUDIO_HINT = /\b(audio|sound|sounds|music|dialogue|voice|voiceover|sfx|noise|song|soundtrack|whisper|narration)\b/i;

/**
 * Cảnh báo capability tính TOÀN cục (không cần AI) dựa trên registry: nêu chỗ
 * prompt yêu cầu thứ model không hỗ trợ. Trả về danh sách MÃ để client localize.
 */
export function capabilityWarnings(
  model: ModelCapability,
  basePrompt: string,
  inputMode: InputMode
): WarningCode[] {
  const warns: WarningCode[] = [];
  if (!model.audio && AUDIO_HINT.test(basePrompt)) {
    warns.push("noAudio");
  }
  if (inputMode === "image") {
    warns.push(model.firstFrame ? "imageMotion" : "noImageInput");
  }
  return warns;
}
