/**
 * Dummy video service
 *
 * Thay thế cho phần sinh video thật (LTX-Video / FastAPI backend chạy trên GPU).
 * Thay vì gọi CUDA/model, service này trả về 1 video NGẪU NHIÊN từ một nhóm
 * video MP4 public có sẵn. Nếu có prompt, ưu tiên chọn video có tag khớp với
 * keyword trong prompt (best-effort), nếu không khớp thì random toàn bộ pool.
 *
 * Nhờ vậy app chạy thuần Next.js, không cần GPU → deploy VPS dễ hơn.
 *
 * POOL gồm 2 nhóm:
 *  - REACHABLE_VIDEOS: các host XÁC NHẬN truy cập được từ môi trường hạn chế
 *    (test-videos.co.uk / media.w3.org / MDN / w3schools / samplelib / filesamples).
 *    Luôn phát được.
 *  - GOOGLE_VIDEOS: nhóm Google gtv-videos-bucket (chủ đề phong phú: car / sci-fi /
 *    city / people...). Bị chặn (403) trong môi trường sandbox này, nhưng HOẠT ĐỘNG
 *    trên VPS/mạng mở. Tắt bằng env DUMMY_INCLUDE_GOOGLE=false nếu VPS của bạn cũng
 *    chặn Google Cloud Storage.
 */

export interface DummyVideo {
  url: string;
  title: string;
  tags: string[];
}

const GTV = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample";
const TV = "https://test-videos.co.uk/vids";

// ---- Host xác nhận truy cập được (200) từ môi trường hạn chế ----
const REACHABLE_VIDEOS: DummyVideo[] = [
  // test-videos.co.uk
  {
    url: `${TV}/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4`,
    title: "Big Buck Bunny (360p)",
    tags: ["animal", "rabbit", "bunny", "nature", "forest", "cartoon", "animation", "cute", "funny"],
  },
  {
    url: `${TV}/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4`,
    title: "Big Buck Bunny (720p)",
    tags: ["animal", "rabbit", "bunny", "nature", "forest", "cartoon", "animation", "cute", "funny"],
  },
  {
    url: `${TV}/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_2MB.mp4`,
    title: "Big Buck Bunny (1080p)",
    tags: ["animal", "rabbit", "bunny", "nature", "forest", "cartoon", "animation", "cute", "funny"],
  },
  {
    url: `${TV}/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4`,
    title: "Jellyfish (360p)",
    tags: ["ocean", "sea", "water", "jellyfish", "animal", "nature", "underwater", "blue", "calm"],
  },
  {
    url: `${TV}/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4`,
    title: "Jellyfish (720p)",
    tags: ["ocean", "sea", "water", "jellyfish", "animal", "nature", "underwater", "blue", "calm"],
  },
  {
    url: `${TV}/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4`,
    title: "Sintel (360p)",
    tags: ["fantasy", "adventure", "animation", "snow", "mountain", "epic", "story", "dragon"],
  },
  {
    url: `${TV}/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4`,
    title: "Sintel (720p)",
    tags: ["fantasy", "adventure", "animation", "snow", "mountain", "epic", "story", "dragon"],
  },

  // media.w3.org
  {
    url: "https://media.w3.org/2010/05/sintel/trailer.mp4",
    title: "Sintel Trailer (W3C)",
    tags: ["fantasy", "adventure", "epic", "animation", "snow", "mountain", "story"],
  },
  {
    url: "https://media.w3.org/2010/05/bunny/movie.mp4",
    title: "Big Buck Bunny (W3C)",
    tags: ["animal", "rabbit", "bunny", "cartoon", "nature", "animation", "forest"],
  },

  // MDN / w3schools
  {
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    title: "Flower (MDN)",
    tags: ["nature", "flower", "plant", "colorful", "calm", "closeup"],
  },
  {
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
    title: "Big Buck Bunny (w3schools)",
    tags: ["animal", "rabbit", "bunny", "cartoon", "nature", "animation"],
  },

  // samplelib.com (theo redirect -> 200)
  {
    url: "https://download.samplelib.com/mp4/sample-5s.mp4",
    title: "SampleLib 5s",
    tags: ["sample", "video", "clip", "generic", "motion"],
  },
  {
    url: "https://download.samplelib.com/mp4/sample-10s.mp4",
    title: "SampleLib 10s",
    tags: ["sample", "video", "clip", "generic", "motion"],
  },
  {
    url: "https://download.samplelib.com/mp4/sample-20s.mp4",
    title: "SampleLib 20s",
    tags: ["sample", "video", "clip", "generic", "motion"],
  },

  // filesamples.com
  {
    url: "https://filesamples.com/samples/video/mp4/sample_640x360.mp4",
    title: "FileSamples 640x360",
    tags: ["sample", "video", "clip", "generic"],
  },
  {
    url: "https://filesamples.com/samples/video/mp4/sample_1280x720.mp4",
    title: "FileSamples 1280x720",
    tags: ["sample", "video", "clip", "generic"],
  },
];

// ---- Google gtv-videos-bucket (chủ đề phong phú, bị chặn ở sandbox) ----
const GOOGLE_VIDEOS: DummyVideo[] = [
  {
    url: `${GTV}/BigBuckBunny.mp4`,
    title: "Big Buck Bunny",
    tags: ["animal", "rabbit", "bunny", "nature", "forest", "cartoon", "animation", "cute", "funny", "fantasy"],
  },
  {
    url: `${GTV}/ElephantsDream.mp4`,
    title: "Elephants Dream",
    tags: ["animation", "fantasy", "sci-fi", "abstract", "surreal", "machine", "dream", "art"],
  },
  {
    url: `${GTV}/ForBiggerBlazes.mp4`,
    title: "For Bigger Blazes",
    tags: ["fire", "blaze", "action", "tech", "device", "abstract", "energy"],
  },
  {
    url: `${GTV}/ForBiggerEscapes.mp4`,
    title: "For Bigger Escapes",
    tags: ["nature", "adventure", "travel", "outdoor", "escape", "landscape", "people"],
  },
  {
    url: `${GTV}/ForBiggerFun.mp4`,
    title: "For Bigger Fun",
    tags: ["fun", "party", "people", "happy", "colorful", "abstract"],
  },
  {
    url: `${GTV}/ForBiggerJoyrides.mp4`,
    title: "For Bigger Joyrides",
    tags: ["car", "vehicle", "drive", "road", "joyride", "action", "speed", "travel"],
  },
  {
    url: `${GTV}/ForBiggerMeltdowns.mp4`,
    title: "For Bigger Meltdowns",
    tags: ["family", "people", "home", "funny", "indoor", "drama"],
  },
  {
    url: `${GTV}/Sintel.mp4`,
    title: "Sintel",
    tags: ["fantasy", "dragon", "adventure", "animation", "snow", "mountain", "girl", "person", "epic", "story"],
  },
  {
    url: `${GTV}/SubaruOutbackOnStreetAndDirt.mp4`,
    title: "Subaru Outback On Street And Dirt",
    tags: ["car", "vehicle", "subaru", "suv", "drive", "road", "dirt", "offroad", "speed", "travel"],
  },
  {
    url: `${GTV}/TearsOfSteel.mp4`,
    title: "Tears of Steel",
    tags: ["sci-fi", "robot", "future", "city", "action", "people", "epic", "machine", "tech"],
  },
  {
    url: `${GTV}/VolkswagenGTIReview.mp4`,
    title: "Volkswagen GTI Review",
    tags: ["car", "vehicle", "volkswagen", "gti", "drive", "review", "road", "speed"],
  },
  {
    url: `${GTV}/WeAreGoingOnBullrun.mp4`,
    title: "We Are Going On Bullrun",
    tags: ["car", "vehicle", "race", "bullrun", "drive", "road", "speed", "travel", "adventure"],
  },
  {
    url: `${GTV}/WhatCarCanYouGetForAGrand.mp4`,
    title: "What Car Can You Get For A Grand",
    tags: ["car", "vehicle", "budget", "drive", "road", "review"],
  },
];

// MẶC ĐỊNH: CHỈ dùng nhóm reachable (luôn phát được, không phụ thuộc Google).
// Bật nhóm Google (chủ đề xe/sci-fi/city/people...) bằng env DUMMY_INCLUDE_GOOGLE=true
// CHỈ KHI mạng của bạn tới được Google Cloud Storage (bị chặn ở nhiều nơi -> 403).
const INCLUDE_GOOGLE = process.env.DUMMY_INCLUDE_GOOGLE === "true";

export const DUMMY_VIDEOS: DummyVideo[] = INCLUDE_GOOGLE
  ? [...REACHABLE_VIDEOS, ...GOOGLE_VIDEOS]
  : [...REACHABLE_VIDEOS];

/**
 * Tách prompt thành các từ khoá (lowercase, bỏ dấu câu, bỏ từ quá ngắn).
 */
function extractKeywords(prompt: string): string[] {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);
}

// Chuẩn hoá để so khớp từ: bỏ 's' cuối (số nhiều) và viết thường.
// VD: "car"/"cars" -> "car", "vehicle"/"vehicles" -> "vehicle".
function norm(w: string): string {
  return w.replace(/s$/i, "");
}

/**
 * So khớp CHÍNH XÁC từ khoá với tag (tránh false-positive do substring,
 * ví dụ "car" không được tính khớp tag "cartoon").
 */
function tagMatches(tag: string, keyword: string): boolean {
  return norm(tag) === norm(keyword);
}

/**
 * Chọn 1 video ngẫu nhiên. Nếu có prompt và khớp tag → random trong tập khớp,
 * ưu tiên video khớp NHIỀU keyword nhất.
 */
export function getRandomVideo(prompt?: string): DummyVideo {
  if (prompt && prompt.trim().length > 0) {
    const keywords = extractKeywords(prompt);

    if (keywords.length > 0) {
      // Tính điểm khớp cho từng video (số keyword trùng với tag).
      const scored = DUMMY_VIDEOS.map((video) => {
        const score = video.tags.reduce(
          (acc, tag) => acc + (keywords.some((k) => tagMatches(tag, k)) ? 1 : 0),
          0
        );
        return { video, score };
      });

      const maxScore = Math.max(...scored.map((s) => s.score));

      if (maxScore > 0) {
        // Lấy tất cả video có điểm cao nhất → random trong đó.
        const best = scored.filter((s) => s.score === maxScore).map((s) => s.video);
        return best[Math.floor(Math.random() * best.length)];
      }
    }
  }

  // Không có prompt hoặc không khớp → random toàn pool.
  return DUMMY_VIDEOS[Math.floor(Math.random() * DUMMY_VIDEOS.length)];
}

/**
 * Trả về toàn bộ pool (tiện cho endpoint GET / debug).
 */
export function getAllVideos(): DummyVideo[] {
  return DUMMY_VIDEOS;
}
