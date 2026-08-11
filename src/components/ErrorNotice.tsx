"use client";

import { IconRefresh } from "@tabler/icons-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { errorMessage, type ApiFailure } from "@/lib/apiError";
import { UPLOAD_MAX_LABEL } from "@/lib/uploadLimits";

interface Props {
  /** Null hides the notice entirely. */
  failure: ApiFailure | null;
  /** Re-runs the request. The retry button only appears when both this is
   *  supplied and the failure is one retrying could actually fix. */
  onRetry?: () => void;
  /** Suppresses retry while a request is already in flight. */
  busy?: boolean;
  /** Drops the "Error" heading, for tight layouts. */
  compact?: boolean;
  className?: string;
}

export default function ErrorNotice({
  failure,
  onRetry,
  busy = false,
  compact = false,
  className = "",
}: Props) {
  const { t } = useLanguage();
  if (!failure) return null;

  // The limit is the only placeholder any message uses today; passing it
  // unconditionally keeps callers from having to know which codes need it.
  const message = errorMessage(failure, t, { limit: UPLOAD_MAX_LABEL });
  const showRetry = failure.retryable && !!onRetry;

  return (
    <div
      role="alert"
      className={`rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-600 dark:text-red-400 ${className}`}
    >
      {!compact && <p className="font-medium">{t("common.error")}</p>}
      <p className={compact ? "text-sm" : "mt-1 text-sm"}>{message}</p>
      {showRetry && (
        <button
          type="button"
          disabled={busy}
          onClick={onRetry}
          className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-500/40 px-3 py-1.5 font-medium text-xs transition-colors hover:bg-red-500/10 disabled:opacity-50"
        >
          <IconRefresh className="size-3.5" />
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}
