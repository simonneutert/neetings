// Minimal error code → i18n key mapping for codes that are actually used at runtime
const ERROR_KEY_MAP: Record<
  string,
  {
    userKey: string;
    actionKey: string;
    severity: "error" | "warning" | "info";
    recoverable: boolean;
  }
> = {
  UNKNOWN_ERROR: {
    userKey: "errors.general.unknown",
    actionKey: "errors.general.unknown_action",
    severity: "error",
    recoverable: false,
  },
  VALIDATION_WARNING: {
    userKey: "warnings.validation.general",
    actionKey: "warnings.validation.general_action",
    severity: "warning",
    recoverable: true,
  },
  EXPORT_FORMAT_ERROR: {
    userKey: "errors.export.format_error",
    actionKey: "errors.export.format_error_action",
    severity: "error",
    recoverable: true,
  },
  INVALID_MEETING_DATA: {
    userKey: "errors.import.invalid_meeting_data",
    actionKey: "errors.import.invalid_meeting_data_action",
    severity: "warning",
    recoverable: true,
  },
  INVALID_ATTENDEE_DATA: {
    userKey: "errors.import.invalid_attendee_data",
    actionKey: "errors.import.invalid_attendee_data_action",
    severity: "warning",
    recoverable: true,
  },
  CORRUPTED_DATA: {
    userKey: "errors.import.corrupted_data",
    actionKey: "errors.import.corrupted_data_action",
    severity: "error",
    recoverable: false,
  },
  FILE_PROCESSING_ERROR: {
    userKey: "errors.import.invalid_file_type",
    actionKey: "errors.import.invalid_file_type_action",
    severity: "error",
    recoverable: false,
  },
};

const DEFAULT_ERROR = {
  userKey: "errors.general.unknown",
  actionKey: "errors.general.unknown_action",
  severity: "error" as const,
  recoverable: false,
};

function getErrorDef(code: string) {
  return ERROR_KEY_MAP[code] || DEFAULT_ERROR;
}

export function getLocalizedErrorMessage(
  code: string,
  t: (key: string, options?: Record<string, string | number>) => string,
  context?: Record<string, any>,
): string {
  const def = getErrorDef(code);
  const translated = t(def.userKey);

  if (context) {
    return Object.entries(context).reduce((str, [key, value]) => {
      return str.replace(new RegExp(`{{${key}}}`, "g"), String(value));
    }, translated);
  }

  return translated;
}

export function getLocalizedActionMessage(
  code: string,
  t: (key: string, options?: Record<string, string | number>) => string,
  context?: Record<string, any>,
): string {
  const def = getErrorDef(code);
  const translated = t(def.actionKey);

  if (context) {
    return Object.entries(context).reduce((str, [key, value]) => {
      return str.replace(new RegExp(`{{${key}}}`, "g"), String(value));
    }, translated);
  }

  return translated;
}

export function getErrorSeverity(code: string): "error" | "warning" | "info" {
  return getErrorDef(code).severity;
}

export function isRecoverable(code: string): boolean {
  return getErrorDef(code).recoverable;
}

export function formatImportSummary(
  _total: number,
  successful: number,
  failed: number,
  warnings: number,
  t: (key: string, options?: Record<string, string | number>) => string,
): string {
  const parts: string[] = [];

  if (successful > 0) {
    const key = successful === 1
      ? "import.summary.successful_one"
      : "import.summary.successful_other";
    parts.push(t(key, { count: successful }));
  }

  if (failed > 0) {
    const key = failed === 1
      ? "import.summary.failed_one"
      : "import.summary.failed_other";
    parts.push(t(key, { count: failed }));
  }

  if (warnings > 0) {
    const key = warnings === 1
      ? "import.summary.warnings_one"
      : "import.summary.warnings_other";
    parts.push(t(key, { count: warnings }));
  }

  return parts.join(", ");
}

export function formatRecoverySummary(
  recoveredCount: number,
  totalCount: number,
  t: (key: string, options?: Record<string, string | number>) => string,
): string {
  if (recoveredCount === 0) {
    return t("import.summary.no_recovery");
  }

  const key = totalCount === 1
    ? "import.summary.recovered_one"
    : "import.summary.recovered_other";
  return t(key, { recovered: recoveredCount, total: totalCount });
}

export function formatFailedImportSummary(
  t: (key: string, options?: Record<string, string | number>) => string,
): string {
  return t("import.summary.failed_no_data");
}
