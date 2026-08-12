// Single source of truth for upload size limits, shared by the API route and
// the client forms so the enforced limit and the advertised limit can't drift.
//
// Why 4 MB and not the 20 MB we used to claim: Vercel rejects any serverless
// request body over ~4.5 MB *before* the route handler runs, so a larger file
// never reached our own size check — the user got a raw
// FUNCTION_PAYLOAD_TOO_LARGE page instead of a translated message. Staying
// under that ceiling keeps the failure ours to report.

export const UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

export const UPLOAD_MAX_LABEL = "4 MB";

/** True when the file is small enough to survive the platform body limit. */
export function isWithinUploadLimit(size: number): boolean {
  return size <= UPLOAD_MAX_BYTES;
}
