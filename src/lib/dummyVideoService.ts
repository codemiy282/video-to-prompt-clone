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
// Tag vocabulary được mở rộng (nhiều từ đồng nghĩa) để prompt khớp được nhiều
// hơn — VD prompt "a hare hopping in the woods at sunrise" vẫn khớp Big Buck
// Bunny nhờ các tag hare/woods/sunny. Tất cả URL dưới đây đã verify trả 200 và
// là clip NGẮN (10s–1 phút), hợp cho preview.
const REACHABLE_VIDEOS: DummyVideo[] = [
  // --- Big Buck Bunny (rabbit / forest / cartoon) ---
  {
    url: `${TV}/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4`,
    title: "Big Buck Bunny (360p)",
    tags: ["animal", "rabbit", "bunny", "hare", "nature", "forest", "woods", "tree", "meadow", "grass", "cartoon", "animation", "cute", "funny", "comedy", "colorful", "sunny", "day", "cinematic"],
  },
  {
    url: `${TV}/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4`,
    title: "Big Buck Bunny (720p)",
    tags: ["animal", "rabbit", "bunny", "hare", "nature", "forest", "woods", "tree", "meadow", "grass", "cartoon", "animation", "cute", "funny", "comedy", "colorful", "sunny", "day", "cinematic"],
  },
  {
    url: `${TV}/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_2MB.mp4`,
    title: "Big Buck Bunny (1080p)",
    tags: ["animal", "rabbit", "bunny", "hare", "nature", "forest", "woods", "tree", "meadow", "grass", "cartoon", "animation", "cute", "funny", "comedy", "colorful", "sunny", "day", "cinematic"],
  },

  // --- Jellyfish (ocean / underwater / calm) ---
  {
    url: `${TV}/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4`,
    title: "Jellyfish (360p)",
    tags: ["ocean", "sea", "water", "jellyfish", "marine", "aquatic", "underwater", "deep", "blue", "glow", "bioluminescent", "animal", "nature", "calm", "float", "dark", "aquarium", "slow"],
  },
  {
    url: `${TV}/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4`,
    title: "Jellyfish (720p)",
    tags: ["ocean", "sea", "water", "jellyfish", "marine", "aquatic", "underwater", "deep", "blue", "glow", "bioluminescent", "animal", "nature", "calm", "float", "dark", "aquarium", "slow"],
  },
  {
    url: `${TV}/jellyfish/mp4/h264/1080/Jellyfish_1080_10s_2MB.mp4`,
    title: "Jellyfish (1080p)",
    tags: ["ocean", "sea", "water", "jellyfish", "marine", "aquatic", "underwater", "deep", "blue", "glow", "bioluminescent", "animal", "nature", "calm", "float", "dark", "aquarium", "slow"],
  },

  // --- Sintel (fantasy / snow / dragon / warrior) ---
  {
    url: `${TV}/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4`,
    title: "Sintel (360p)",
    tags: ["fantasy", "adventure", "animation", "snow", "ice", "winter", "cold", "mountain", "cliff", "epic", "story", "dragon", "warrior", "girl", "woman", "quest", "medieval", "journey", "action"],
  },
  {
    url: `${TV}/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4`,
    title: "Sintel (720p)",
    tags: ["fantasy", "adventure", "animation", "snow", "ice", "winter", "cold", "mountain", "cliff", "epic", "story", "dragon", "warrior", "girl", "woman", "quest", "medieval", "journey", "action"],
  },

  // --- media.w3.org ---
  {
    url: "https://media.w3.org/2010/05/sintel/trailer.mp4",
    title: "Sintel Trailer (W3C)",
    tags: ["fantasy", "adventure", "epic", "animation", "snow", "ice", "mountain", "cliff", "dragon", "warrior", "girl", "quest", "medieval", "story", "cinematic", "trailer"],
  },
  {
    url: "https://media.w3.org/2010/05/sintel/trailer_hd.mp4",
    title: "Sintel Trailer HD (W3C)",
    tags: ["fantasy", "adventure", "epic", "animation", "snow", "ice", "mountain", "cliff", "dragon", "warrior", "girl", "quest", "medieval", "story", "cinematic", "trailer"],
  },
  {
    url: "https://media.w3.org/2010/05/bunny/movie.mp4",
    title: "Big Buck Bunny (W3C)",
    tags: ["animal", "rabbit", "bunny", "hare", "cartoon", "nature", "animation", "forest", "woods", "cute", "funny"],
  },

  // --- Blender open-movie trailers (verified 200, ngắn) ---
  {
    url: "https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4",
    title: "Sintel Trailer (Blender)",
    tags: ["fantasy", "adventure", "epic", "animation", "snow", "ice", "mountain", "dragon", "warrior", "girl", "quest", "medieval", "story", "cinematic", "trailer", "flight"],
  },

  // --- MDN / w3schools (flower / nature) ---
  {
    url: "https://mdn.github.io/shared-assets/videos/flower.mp4",
    title: "Flower (MDN)",
    tags: ["nature", "flower", "plant", "botanical", "petal", "bloom", "blossom", "spring", "garden", "macro", "closeup", "colorful", "pink", "red", "calm", "beauty"],
  },
  {
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    title: "Flower (MDN legacy)",
    tags: ["nature", "flower", "plant", "botanical", "petal", "bloom", "blossom", "spring", "garden", "macro", "closeup", "colorful", "pink", "red", "calm", "beauty"],
  },
  {
    url: "https://www.w3schools.com/html/mov_bbb.mp4",
    title: "Big Buck Bunny (w3schools)",
    tags: ["animal", "rabbit", "bunny", "hare", "cartoon", "nature", "animation", "forest", "cute"],
  },

  // --- Generic sample clips (fallback khi prompt không khớp chủ đề nào) ---
  {
    url: "https://download.samplelib.com/mp4/sample-5s.mp4",
    title: "SampleLib 5s",
    tags: ["sample", "video", "clip", "generic", "motion", "footage"],
  },
  {
    url: "https://download.samplelib.com/mp4/sample-10s.mp4",
    title: "SampleLib 10s",
    tags: ["sample", "video", "clip", "generic", "motion", "footage"],
  },
  {
    url: "https://download.samplelib.com/mp4/sample-20s.mp4",
    title: "SampleLib 20s",
    tags: ["sample", "video", "clip", "generic", "motion", "footage"],
  },
  {
    url: "https://filesamples.com/samples/video/mp4/sample_1280x720.mp4",
    title: "FileSamples 1280x720",
    tags: ["sample", "video", "clip", "generic", "footage"],
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
    tags: ["animation", "fantasy", "sci-fi", "scifi", "abstract", "surreal", "machine", "mechanical", "industrial", "dream", "art", "dark", "robot", "future"],
  },
  {
    url: `${GTV}/ForBiggerBlazes.mp4`,
    title: "For Bigger Blazes",
    tags: ["fire", "blaze", "flame", "burn", "action", "tech", "device", "abstract", "energy", "hot", "orange"],
  },
  {
    url: `${GTV}/ForBiggerEscapes.mp4`,
    title: "For Bigger Escapes",
    tags: ["nature", "adventure", "travel", "outdoor", "escape", "landscape", "people", "person", "journey", "explore", "scenic"],
  },
  {
    url: `${GTV}/ForBiggerFun.mp4`,
    title: "For Bigger Fun",
    tags: ["fun", "party", "people", "person", "crowd", "happy", "joy", "colorful", "celebration", "dance"],
  },
  {
    url: `${GTV}/ForBiggerJoyrides.mp4`,
    title: "For Bigger Joyrides",
    tags: ["car", "auto", "automobile", "vehicle", "drive", "driving", "road", "highway", "joyride", "action", "speed", "fast", "travel", "motor"],
  },
  {
    url: `${GTV}/ForBiggerMeltdowns.mp4`,
    title: "For Bigger Meltdowns",
    tags: ["family", "people", "person", "home", "house", "funny", "indoor", "drama", "domestic"],
  },
  {
    url: `${GTV}/Sintel.mp4`,
    title: "Sintel",
    tags: ["fantasy", "dragon", "adventure", "animation", "snow", "ice", "mountain", "cliff", "girl", "woman", "person", "warrior", "quest", "epic", "story", "medieval"],
  },
  {
    url: `${GTV}/SubaruOutbackOnStreetAndDirt.mp4`,
    title: "Subaru Outback On Street And Dirt",
    tags: ["car", "auto", "automobile", "vehicle", "suv", "subaru", "drive", "driving", "road", "street", "dirt", "offroad", "speed", "travel", "motor"],
  },
  {
    url: `${GTV}/TearsOfSteel.mp4`,
    title: "Tears of Steel",
    tags: ["sci-fi", "scifi", "robot", "cyborg", "android", "future", "futuristic", "city", "urban", "street", "action", "people", "person", "epic", "machine", "tech", "dystopia", "war"],
  },
  {
    url: `${GTV}/VolkswagenGTIReview.mp4`,
    title: "Volkswagen GTI Review",
    tags: ["car", "auto", "automobile", "vehicle", "volkswagen", "gti", "drive", "driving", "review", "road", "street", "speed", "motor"],
  },
  {
    url: `${GTV}/WeAreGoingOnBullrun.mp4`,
    title: "We Are Going On Bullrun",
    tags: ["car", "auto", "vehicle", "race", "racing", "bullrun", "drive", "road", "highway", "speed", "fast", "travel", "adventure", "motor"],
  },
  {
    url: `${GTV}/WhatCarCanYouGetForAGrand.mp4`,
    title: "What Car Can You Get For A Grand",
    tags: ["car", "auto", "automobile", "vehicle", "budget", "drive", "road", "review", "motor"],
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
