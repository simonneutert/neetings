export interface ErrorMessageDefinition {
  technical: string;
  userKey: string; // Translation key for user message
  actionKey: string; // Translation key for action message
  severity: "error" | "warning" | "info";
  recoverable: boolean;
}

export const ERROR_MESSAGES: Record<string, ErrorMessageDefinition> = {
  INVALID_FILE_TYPE: {
    technical: "File type not supported",
    userKey: "errors.import.invalid_file_type",
    actionKey: "errors.import.invalid_file_type_action",
    severity: "error",
    recoverable: false,
  },

  FILE_TOO_LARGE: {
    technical: "File exceeds maximum size limit",
    userKey: "errors.import.file_too_large",
    actionKey: "errors.import.file_too_large_action",
    severity: "error",
    recoverable: false,
  },

  CORRUPTED_DATA: {
    technical: "JSON parse error or invalid file structure",
    userKey: "errors.import.corrupted_data",
    actionKey: "errors.import.corrupted_data_action",
    severity: "error",
    recoverable: false,
  },

  VERSION_MISMATCH: {
    technical: "Unsupported export version detected",
    userKey: "errors.import.version_mismatch",
    actionKey: "errors.import.version_mismatch_action",
    severity: "error",
    recoverable: false,
  },

  VERSION_CAN_MIGRATE: {
    technical: "Legacy export version detected",
    userKey: "errors.import.version_can_migrate",
    actionKey: "errors.import.version_can_migrate_action",
    severity: "warning",
    recoverable: true,
  },

  MISSING_REQUIRED_FIELDS: {
    technical: "Required fields are missing from the data",
    userKey: "errors.import.missing_required_fields",
    actionKey: "errors.import.missing_required_fields_action",
    severity: "error",
    recoverable: false,
  },

  INVALID_MEETING_DATA: {
    technical: "Meeting data validation failed",
    userKey: "errors.import.invalid_meeting_data",
    actionKey: "errors.import.invalid_meeting_data_action",
    severity: "warning",
    recoverable: true,
  },

  INVALID_ATTENDEE_DATA: {
    technical: "Attendee data validation failed",
    userKey: "errors.import.invalid_attendee_data",
    actionKey: "errors.import.invalid_attendee_data_action",
    severity: "warning",
    recoverable: true,
  },

  INVALID_BLOCK_DATA: {
    technical: "Block data validation failed",
    userKey: "errors.import.invalid_block_data",
    actionKey: "errors.import.invalid_block_data_action",
    severity: "warning",
    recoverable: true,
  },

  ORPHANED_ATTENDEES: {
    technical: "Attendee references without corresponding attendee data",
    userKey: "errors.import.orphaned_attendees",
    actionKey: "errors.import.orphaned_attendees_action",
    severity: "warning",
    recoverable: true,
  },

  ORPHANED_BLOCKS: {
    technical: "Blocks reference non-existent topic groups",
    userKey: "errors.import.orphaned_blocks",
    actionKey: "errors.import.orphaned_blocks_action",
    severity: "warning",
    recoverable: true,
  },

  EXPORT_FORMAT_ERROR: {
    technical: "Unsupported export format requested",
    userKey: "errors.export.format_error",
    actionKey: "errors.export.format_error_action",
    severity: "error",
    recoverable: true,
  },

  MEMORY_ERROR: {
    technical: "Insufficient memory to process the request",
    userKey: "errors.general.memory_error",
    actionKey: "errors.general.memory_error_action",
    severity: "error",
    recoverable: false,
  },

  NETWORK_ERROR: {
    technical: "Network operation failed",
    userKey: "errors.general.network_error",
    actionKey: "errors.general.network_error_action",
    severity: "error",
    recoverable: true,
  },

  SECURITY_VALIDATION_FAILED: {
    technical: "Security validation failed",
    userKey: "errors.import.security_validation_failed",
    actionKey: "errors.import.security_validation_failed_action",
    severity: "error",
    recoverable: false,
  },

  PARTIAL_IMPORT_SUCCESS: {
    technical: "Some data was successfully imported despite errors",
    userKey: "success.import.partial_success",
    actionKey: "success.import.partial_success_action",
    severity: "info",
    recoverable: true,
  },

  EXPORT_SUCCESS: {
    technical: "Export completed successfully",
    userKey: "success.export.complete",
    actionKey: "success.export.complete_action",
    severity: "info",
    recoverable: true,
  },

  IMPORT_SUCCESS: {
    technical: "Import completed successfully",
    userKey: "success.import.complete",
    actionKey: "success.import.complete_action",
    severity: "info",
    recoverable: true,
  },

  VALIDATION_WARNING: {
    technical: "Data validation produced warnings",
    userKey: "warnings.validation.general",
    actionKey: "warnings.validation.general_action",
    severity: "warning",
    recoverable: true,
  },

  UNKNOWN_ERROR: {
    technical: "An unexpected error occurred",
    userKey: "errors.general.unknown",
    actionKey: "errors.general.unknown_action",
    severity: "error",
    recoverable: false,
  },
};

export function getErrorMessage(code: string): ErrorMessageDefinition {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
}

// Get localized error message
export function getLocalizedErrorMessage(
  code: string,
  t: (key: string, options?: Record<string, string | number>) => string,
  context?: Record<string, any>,
): string {
  const errorDef = getErrorMessage(code);
  const translatedMessage = t(errorDef.userKey);

  if (context) {
    return Object.entries(context).reduce((str, [key, value]) => {
      return str.replace(new RegExp(`{{${key}}}`, "g"), String(value));
    }, translatedMessage);
  }

  return translatedMessage;
}

// Get localized action message
export function getLocalizedActionMessage(
  code: string,
  t: (key: string, options?: Record<string, string | number>) => string,
  context?: Record<string, any>,
): string {
  const errorDef = getErrorMessage(code);
  const translatedAction = t(errorDef.actionKey);

  if (context) {
    return Object.entries(context).reduce((str, [key, value]) => {
      return str.replace(new RegExp(`{{${key}}}`, "g"), String(value));
    }, translatedAction);
  }

  return translatedAction;
}

// Legacy functions for backward compatibility (deprecated)
export function formatErrorMessage(
  code: string,
  context?: Record<string, any>,
): string {
  const message = getErrorMessage(code);
  // Return fallback English text for compatibility
  let formatted = message.userKey;

  if (context) {
    formatted = formatted.replace(/\{(\w+)\}/g, (match, key) => {
      return context[key]?.toString() || match;
    });
  }

  return formatted;
}

export function formatActionMessage(
  code: string,
  context?: Record<string, any>,
): string {
  const message = getErrorMessage(code);
  // Return fallback English text for compatibility
  let formatted = message.actionKey;

  if (context) {
    formatted = formatted.replace(/\{(\w+)\}/g, (match, key) => {
      return context[key]?.toString() || match;
    });
  }

  return formatted;
}

export function getErrorSeverity(code: string): "error" | "warning" | "info" {
  return getErrorMessage(code).severity;
}

export function isRecoverable(code: string): boolean {
  return getErrorMessage(code).recoverable;
}

export function createUserFriendlyError(
  code: string,
  technicalMessage: string,
  t: (key: string, options?: Record<string, string | number>) => string,
  context?: Record<string, any>,
): {
  code: string;
  message: string;
  action: string;
  severity: "error" | "warning" | "info";
  recoverable: boolean;
  technical: string;
  context?: Record<string, any>;
} {
  const errorDef = getErrorMessage(code);

  return {
    code,
    message: getLocalizedErrorMessage(code, t, context),
    action: getLocalizedActionMessage(code, t, context),
    severity: errorDef.severity,
    recoverable: errorDef.recoverable,
    technical: technicalMessage,
    context,
  };
}

export function formatImportSummary(
  total: number,
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

export function formatExportSummary(
  meetingCount: number,
  attendeeCount: number,
  format: string,
  t: (key: string, options?: Record<string, string | number>) => string,
  size?: number,
): string {
  const meetingKey = meetingCount === 1
    ? "export.summary.meetings_one"
    : "export.summary.meetings_other";
  const attendeeKey = attendeeCount === 1
    ? "export.summary.attendees_one"
    : "export.summary.attendees_other";

  const meetingText = t(meetingKey, { count: meetingCount });
  const attendeeText = t(attendeeKey, { count: attendeeCount });

  let summary = t("export.summary.complete", {
    meetings: meetingText,
    attendees: attendeeText,
    format: format.toUpperCase(),
  });

  if (size) {
    const sizeKB = Math.round(size / 1024);
    summary += ` (${sizeKB} KB)`;
  }

  return summary;
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
