/**
 * Next.js API route for image-to-video (DUMMY MODE)
 *
 * Trước đây route này gọi FastAPI backend (LTX-Video) chạy trên GPU/CUDA để
 * sinh video thật. Nay đã thay bằng DUMMY service: nhận ảnh + prompt và trả về
 * link của 1 video NGẪU NHIÊN từ một nhóm video có sẵn (chọn theo keyword của
 * prompt nếu khớp). Không còn phụ thuộc GPU → deploy VPS dễ hơn.
 */

import { NextRequest, NextResponse } from "next/server";
import { getRandomVideo, getAllVideos } from "@/lib/dummyVideoService";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

interface GenerationResponse {
  success: boolean;
  video_url?: string;
  title?: string;
  error?: string;
  message?: string;
}

/**
 * POST /api/ltx-video
 * Nhận ảnh (bắt buộc) + prompt (tuỳ chọn) → trả về 1 video random.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const prompt = (formData.get("prompt") as string | null) ?? "";

    // 2. Validate: bắt buộc phải có ảnh (giữ đúng luồng "đẩy hình → ra video").
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_FILE",
          message: "An image file is required",
        } as GenerationResponse,
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "FILE_TOO_LARGE",
          message: `Image must be smaller than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`,
        } as GenerationResponse,
        { status: 400 }
      );
    }

    // 3. Chọn video random (ưu tiên khớp keyword prompt nếu có).
    const video = getRandomVideo(prompt);

    console.log(
      `[dummy-video] image=${file.name} prompt="${prompt.slice(0, 60)}" -> ${video.title}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Dummy video selected",
        video_url: video.url,
        title: video.title,
      } as GenerationResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("[dummy-video] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: errorMessage,
      } as GenerationResponse,
      { status: 500 }
    );
  }
}

/**
 * GET /api/ltx-video
 * Health + liệt kê pool video (tiện debug).
 */
export async function GET(): Promise<NextResponse> {
  const videos = getAllVideos();
  return NextResponse.json({
    success: true,
    mode: "dummy",
    count: videos.length,
    videos,
  });
}
