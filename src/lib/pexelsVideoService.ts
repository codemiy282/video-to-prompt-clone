/**
 * Pexels video service (OPTIONAL, MIỄN PHÍ)
 *
 * Nâng cấp cho image-to-video: thay vì chỉ chọn 1 video từ pool tĩnh
 * (dummyVideoService), nếu có PEXELS_API_KEY thì tìm 1 video stock THẬT khớp
 * với prompt của người dùng qua Pexels Video Search API (free tier: ~200
 * request/giờ, 20k/tháng — chi phí 0đ).
 *
 * Thiết kế "graceful fallback": hàm này trả về null khi
 *  - không có API key, hoặc
 *  - prompt rỗng/không tách được từ khoá, hoặc
 *  - Pexels lỗi/timeout/không có kết quả.
 * Khi null, route sẽ tự quay về pool tĩnh (getRandomVideo). Nhờ vậy app vẫn
 * chạy bình thường khi CHƯA cấu hình key.
 *
 * Lấy key miễn phí tại: https://www.pexels.com/api/
 */

import type { DummyVideo } from "./dummyVideoService";

const PEXELS_ENDPOINT = "https://api.pexels.com/videos/search";
const REQUEST_TIMEOUT_MS = 8000;

// Bỏ các từ quá chung để câu query khớp trúng chủ đề hơn.
const STOPWORDS = new Set([
  "the", "a", "an", "of", "in", "on", "at", "with", "and", "or", "to", "for",
  "is", "are", "was", "were", "by", "from", "into", "over", "under", "this",
  "that", "these", "those", "it", "its", "as", "be", "your", "you",
  "cinematic", "shot", "video", "clip", "scene", "footage", "style", "high",
  "quality", "detailed", "realistic",
]);

interface PexelsFile {
  quality?: string;
  file_type?: string;
  width?: number;
  height?: number;
  link?: string;
}

interface PexelsVideo {
  user?: { name?: string };
  video_files?: PexelsFile[];
}

interface PexelsResponse {
  videos?: PexelsVideo[];
}

/** Tách prompt thành câu query ngắn gồm các từ khoá có ý nghĩa. */
function buildQuery(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
    .slice(0, 6)
    .join(" ")
    .trim();
}

/**
 * Chọn file mp4 hợp lý: ưu tiên độ phân giải cao nhất nhưng ≤ 1080p (nhẹ, tải
 * nhanh cho preview); nếu không có, lấy file nhỏ nhất.
 */
function pickFile(video: PexelsVideo): PexelsFile | null {
  const mp4 = (video.video_files ?? []).filter(
    (f) => f.file_type === "video/mp4" && typeof f.link === "string"
  );
  if (mp4.length === 0) return null;

  const underCap = mp4
    .filter((f) => (f.height ?? 0) <= 1080)
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));

  return underCap[0] ?? mp4.sort((a, b) => (a.height ?? 0) - (b.height ?? 0))[0];
}

/**
 * Tìm 1 video Pexels khớp prompt. Trả về null nếu không dùng được (route sẽ
 * fallback về pool tĩnh).
 */
export async function searchPexelsVideo(
  prompt: string
): Promise<DummyVideo | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;

  const query = buildQuery(prompt);
  if (!query) return null;

  const url =
    `${PEXELS_ENDPOINT}?query=${encodeURIComponent(query)}` +
    `&per_page=15&orientation=landscape&size=medium`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: { Authorization: key },
      signal: controller.signal,
    });
    if (!res.ok) return null;

    const data = (await res.json()) as PexelsResponse;
    const videos = Array.isArray(data.videos) ? [...data.videos] : [];
    if (videos.length === 0) return null;

    // Xáo trộn để mỗi lần gọi có thể ra video khác nhau (đa dạng hơn).
    videos.sort(() => Math.random() - 0.5);

    for (const v of videos) {
      const file = pickFile(v);
      if (file?.link) {
        return {
          url: file.link,
          title: `Pexels · ${v.user?.name ?? "stock"} (${file.width ?? "?"}x${file.height ?? "?"})`,
          tags: query.split(" "),
        };
      }
    }
    return null;
  } catch {
    // Timeout / network / parse error -> fallback.
    return null;
  } finally {
    clearTimeout(timer);
  }
}
