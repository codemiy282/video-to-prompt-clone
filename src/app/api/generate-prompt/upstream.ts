// Turns an unknown thrown value into a safe error code.
//
// The Gemini SDK throws errors whose message embeds the request URL, the model
// name, quota metric ids and a billing link. That text used to be forwarded
// verbatim to the browser. Classify it here instead: the detail goes to the
// server log, the caller gets a code.

export type UpstreamCode = "UPSTREAM_BUSY" | "SERVICE_ERROR";

export interface UpstreamFailure {
  code: UpstreamCode;
  /** HTTP status to answer with. */
  status: number;
  retryable: boolean;
}

const QUOTA_PATTERN = /\b429\b|too many requests|quota|rate.?limit|resource_exhausted/i;

/**
 * Classify a caught error and log the real cause server-side.
 *
 * `context` names the operation so the log line is greppable, e.g. "convert".
 */
export function classifyUpstream(err: unknown, context: string): UpstreamFailure {
  const detail = err instanceof Error ? err.message : String(err);

  // Server-only. Never returned to the caller.
  console.error(`[${context}] upstream failure:`, detail);

  if (QUOTA_PATTERN.test(detail)) {
    return { code: "UPSTREAM_BUSY", status: 503, retryable: true };
  }
  return { code: "SERVICE_ERROR", status: 502, retryable: true };
}
