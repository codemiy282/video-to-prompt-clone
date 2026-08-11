// Normalises API failures into a small set of stable codes the UI can translate.
//
// Two things this fixes:
//   1. The routes used to hand the raw upstream message (Google's 429 text,
//      internal endpoint URLs, billing links) straight to the browser.
//   2. Routes disagreed on error shape — /api/generate-prompt returns
//      { error: { code, message, retryable } } while the newer routes return
//      { error: "CODE", message }. Callers had to know which was which.
//
// Everything user-facing now flows through a code, so the message can live in
// the i18n dictionaries and follow the reader's language.

export const API_ERROR_CODES = [
  "BAD_REQUEST",
  "EMPTY_INPUT",
  "INPUT_TOO_LONG",
  "INVALID_URL",
  "FILE_TOO_LARGE",
  "RATE_LIMIT",
  "UPSTREAM_BUSY",
  "SERVICE_ERROR",
  "NETWORK",
  "UNKNOWN",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiFailure {
  code: ApiErrorCode;
  /** Whether offering a "try again" affordance makes sense. */
  retryable: boolean;
}

// Codes emitted by the routes, mapped onto the UI-facing set above. Several
// server codes collapse into one user-facing message on purpose: a reader does
// not care whether it was the prompt, the idea, or the message that was blank.
const SERVER_CODE_MAP: Record<string, ApiErrorCode> = {
  BAD_REQUEST: "BAD_REQUEST",
  EMPTY_PROMPT: "EMPTY_INPUT",
  EMPTY_IDEA: "EMPTY_INPUT",
  EMPTY_MESSAGE: "EMPTY_INPUT",
  NO_MODELS: "BAD_REQUEST",
  UNKNOWN_MODEL: "BAD_REQUEST",
  INVALID_COUNT: "BAD_REQUEST",
  PROMPT_TOO_LONG: "INPUT_TOO_LONG",
  IDEA_TOO_LONG: "INPUT_TOO_LONG",
  MESSAGE_TOO_LONG: "INPUT_TOO_LONG",
  INVALID_URL: "INVALID_URL",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  RATE_LIMIT: "RATE_LIMIT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT",
  UPSTREAM_BUSY: "UPSTREAM_BUSY",
  SERVICE_ERROR: "SERVICE_ERROR",
  GEMINI_API_ERROR: "SERVICE_ERROR",
  CONVERT_FAILED: "SERVICE_ERROR",
  VALIDATE_FAILED: "SERVICE_ERROR",
  SCENES_FAILED: "SERVICE_ERROR",
  INTERNAL_ERROR: "SERVICE_ERROR",
};

const RETRYABLE: ReadonlySet<ApiErrorCode> = new Set<ApiErrorCode>([
  "RATE_LIMIT",
  "UPSTREAM_BUSY",
  "SERVICE_ERROR",
  "NETWORK",
]);

function codeFrom(raw: unknown): ApiErrorCode {
  if (typeof raw !== "string") return "UNKNOWN";
  return SERVER_CODE_MAP[raw] ?? "UNKNOWN";
}

/** Read either error shape returned by the API into one normalised failure. */
export function toApiFailure(data: unknown): ApiFailure {
  const body = (data ?? {}) as { error?: unknown };
  const err = body.error;

  // Shape A — /api/generate-prompt: { error: { code, retryable } }
  if (err && typeof err === "object") {
    const obj = err as { code?: unknown; retryable?: unknown };
    const code = codeFrom(obj.code);
    const retryable =
      typeof obj.retryable === "boolean" ? obj.retryable : RETRYABLE.has(code);
    return { code, retryable };
  }

  // Shape B — newer routes: { error: "CODE", message }
  const code = codeFrom(err);
  return { code, retryable: RETRYABLE.has(code) };
}

/** The failure to show when fetch itself threw (offline, DNS, aborted). */
export const NETWORK_FAILURE: ApiFailure = { code: "NETWORK", retryable: true };

/** i18n key for a failure, e.g. "errors.RATE_LIMIT". */
export function errorKey(failure: ApiFailure): string {
  return `errors.${failure.code}`;
}

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/** Localised message for a failure. `vars` fills placeholders like {limit}. */
export function errorMessage(
  failure: ApiFailure,
  t: Translate,
  vars?: Record<string, string | number>
): string {
  return t(errorKey(failure), vars);
}

/**
 * Read a fetch Response + parsed body into a localised message.
 * Use in a catch-free path; pair with NETWORK_FAILURE when fetch itself throws.
 */
export function failureFrom(data: unknown): ApiFailure {
  return toApiFailure(data);
}
