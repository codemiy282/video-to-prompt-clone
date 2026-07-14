// Contract types and response helpers for POST /api/generate-prompt.
// Shapes are taken from the certified docs/contracts/api-contracts.md.

export type DetectedType = "video" | "image" | "text";

export type ErrorCode =
  | "BAD_REQUEST"
  | "FILE_TOO_LARGE"
  | "RATE_LIMIT_EXCEEDED"
  | "GEMINI_API_ERROR"
  | "INTERNAL_ERROR";

export interface SuccessBody {
  success: true;
  prompt: string;
  details: {
    model: string;
    detectedType: DetectedType;
  };
}

export interface ErrorBody {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    retryable: boolean;
  };
}

export function successResponse(
  prompt: string,
  detectedType: DetectedType,
  model: string
): Response {
  const body: SuccessBody = {
    success: true,
    prompt,
    details: { model, detectedType },
  };
  return Response.json(body, { status: 200 });
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  retryable: boolean
): Response {
  const body: ErrorBody = {
    success: false,
    error: { code, message, retryable },
  };
  const init: ResponseInit = { status };
  if (code === "RATE_LIMIT_EXCEEDED") {
    init.headers = { "Retry-After": "60" };
  }
  return Response.json(body, init);
}
