/**
 * Next.js API route for LTX-Video integration
 * 
 * This route bridges the frontend with either:
 * 1. Local Python backend (FastAPI) - Recommended for RTX 5070
 * 2. Remote API service
 * 
 * Place this at: src/app/api/ltx-video/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for video generation

// Configuration
const BACKEND_URL = process.env.LTX_VIDEO_BACKEND_URL || "http://localhost:8000";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

interface GenerationRequest {
  file: File;
  prompt: string;
  num_frames?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
}

interface GenerationResponse {
  success: boolean;
  video_url?: string;
  video_base64?: string;
  error?: string;
  message?: string;
}

/**
 * POST /api/ltx-video
 * Generate video from image
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const prompt = formData.get("prompt") as string | null;
    const num_frames = formData.get("num_frames") as string | null;
    const guidance_scale = formData.get("guidance_scale") as string | null;
    const num_inference_steps = formData.get("num_inference_steps") as string | null;

    // 2. Validate inputs
    if (!file || !prompt) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_FIELDS",
          message: "File and prompt are required",
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

    if (prompt.trim().length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_PROMPT",
          message: "Prompt must be at least 3 characters",
        } as GenerationResponse,
        { status: 400 }
      );
    }

    // 3. Prepare form data for backend
    const backendFormData = new FormData();
    backendFormData.append("image", file);
    backendFormData.append("prompt", prompt);

    if (num_frames) {
      const frames = parseInt(num_frames);
      if (frames >= 1 && frames <= 120) {
        backendFormData.append("num_frames", String(frames));
      }
    }

    if (guidance_scale) {
      const scale = parseFloat(guidance_scale);
      if (scale >= 1.0 && scale <= 20.0) {
        backendFormData.append("guidance_scale", String(scale));
      }
    }

    if (num_inference_steps) {
      const steps = parseInt(num_inference_steps);
      if (steps >= 10 && steps <= 100) {
        backendFormData.append("num_inference_steps", String(steps));
      }
    }

    console.log("[LTX-Video] Sending request to backend:", BACKEND_URL);
    console.log("[LTX-Video] Prompt:", prompt.substring(0, 100) + "...");

    // 4. Call backend API
    const backendResponse = await fetch(`${BACKEND_URL}/generate-video`, {
      method: "POST",
      body: backendFormData,
      timeout: 300000, // 5 minutes
    });

    // 5. Handle backend response
    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({
        error: "Unknown error",
      }));

      console.error("[LTX-Video] Backend error:", backendResponse.status, errorData);

      return NextResponse.json(
        {
          success: false,
          error: `BACKEND_ERROR_${backendResponse.status}`,
          message: errorData.detail || errorData.error || "Video generation failed",
        } as GenerationResponse,
        { status: backendResponse.status }
      );
    }

    // 6. Get video data
    const videoBuffer = await backendResponse.arrayBuffer();
    console.log("[LTX-Video] Video generated:", videoBuffer.byteLength, "bytes");

    // 7. Return video as base64 or file
    // Option A: Return as base64 (simpler for frontend, ~33% larger)
    const videoBase64 = Buffer.from(videoBuffer).toString("base64");

    return NextResponse.json(
      {
        success: true,
        message: "Video generated successfully",
        video_base64: videoBase64,
      } as GenerationResponse,
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Option B: Stream video directly (more efficient)
    // return new NextResponse(videoBuffer, {
    //   status: 200,
    //   headers: {
    //     "Content-Type": "video/mp4",
    //     "Content-Disposition": "attachment; filename=generated_video.mp4",
    //   },
    // });

  } catch (error) {
    console.error("[LTX-Video] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("ECONNREFUSED")) {
      return NextResponse.json(
        {
          success: false,
          error: "BACKEND_UNAVAILABLE",
          message: "Video generation backend is not running. Start it with: python -m uvicorn ltx_video_api:app",
        } as GenerationResponse,
        { status: 503 }
      );
    }

    if (errorMessage.includes("timeout")) {
      return NextResponse.json(
        {
          success: false,
          error: "TIMEOUT",
          message: "Video generation timed out. The model might be too large for your GPU.",
        } as GenerationResponse,
        { status: 504 }
      );
    }

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
 * GET /api/ltx-video/status
 * Check backend service status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();

    return NextResponse.json({
      success: true,
      backend_status: data,
    });
  } catch (error) {
    console.error("[LTX-Video] Backend health check failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Backend unavailable",
      },
      { status: 503 }
    );
  }
}
