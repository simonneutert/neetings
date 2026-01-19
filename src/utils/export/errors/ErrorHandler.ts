import {
  createExportResult,
  createImportResult,
  createValidationError,
  DataCorruptionError,
  ExportError,
  ExportResult,
  FileProcessingError,
  ImportResult,
  ImportValidationError,
  isDataCorruptionError,
  isExportError,
  isFileProcessingError,
  isImportValidationError,
  isSecurityError,
  isVersionMismatchError,
  PartialImportData,
  SecurityError,
  ValidationErrorDetail,
  VersionMismatchError,
} from "./ExportErrors";
import {
  createUserFriendlyError,
  formatActionMessage,
  formatImportSummary,
} from "./ErrorMessages";

export class ExportErrorHandler {
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly SUPPORTED_MIME_TYPES = [
    "application/json",
    "text/json",
  ];
  // private static readonly RECOVERY_ATTEMPTS = 3; // Future use

  static handleImportError(
    error: unknown,
    context?: Record<string, any>,
  ): ImportResult {
    const startTime = Date.now();

    try {
      if (isImportValidationError(error)) {
        return this.handleValidationError(error, context);
      }

      if (isFileProcessingError(error)) {
        return this.handleFileProcessingError(error, context);
      }

      if (isVersionMismatchError(error)) {
        return this.handleVersionMismatchError(error, context);
      }

      if (isDataCorruptionError(error)) {
        return this.handleDataCorruptionError(error, context);
      }

      if (isSecurityError(error)) {
        return this.handleSecurityError(error, context);
      }

      if (isExportError(error)) {
        return this.handleGenericExportError(error, context);
      }

      // Handle unknown errors
      return this.handleUnknownError(error, context);
    } finally {
      const processingTime = Date.now() - startTime;
      console.debug(`Error handling took ${processingTime}ms`);
    }
  }

  static handleExportError(
    error: unknown,
    _context?: Record<string, any>,
  ): ExportResult {
    const startTime = Date.now();

    try {
      if (isExportError(error)) {
        const userFriendlyError = createUserFriendlyError(
          error.code,
          error.message,
          error.context,
        );

        return createExportResult(false, {
          errors: [createValidationError(
            "export",
            userFriendlyError.message,
            error.code,
          )],
          processingTime: Date.now() - startTime,
        });
      }

      return createExportResult(false, {
        errors: [createValidationError(
          "export",
          "An unexpected error occurred during export",
          "UNKNOWN_ERROR",
        )],
        processingTime: Date.now() - startTime,
      });
    } finally {
      const processingTime = Date.now() - startTime;
      console.debug(`Export error handling took ${processingTime}ms`);
    }
  }

  private static handleValidationError(
    error: ImportValidationError,
    _context?: Record<string, any>,
  ): ImportResult {
    const partialData = this.extractPartialData(error);

    return createImportResult(false, {
      errors: error.validationErrors,
      partialSuccess: partialData && partialData.recoveredCount > 0,
      recoveredData: partialData,
      summary: partialData
        ? formatImportSummary(
          partialData.totalCount,
          partialData.recoveredCount,
          partialData.totalCount - partialData.recoveredCount,
          0,
        )
        : "Import failed due to validation errors",
      failedItems: partialData
        ? partialData.totalCount - partialData.recoveredCount
        : 0,
      totalItems: partialData ? partialData.totalCount : 0,
    });
  }

  private static handleFileProcessingError(
    error: FileProcessingError,
    _context?: Record<string, any>,
  ): ImportResult {
    const userFriendlyError = createUserFriendlyError(
      error.code,
      error.message,
      {
        fileType: error.fileType,
        fileName: error.fileName,
        fileSize: error.fileSize,
        ..._context,
      },
    );

    return createImportResult(false, {
      errors: [createValidationError(
        "file",
        userFriendlyError.message,
        error.code,
        {
          value: error.fileName,
          expected: "JSON file",
        },
      )],
      summary: userFriendlyError.action,
    });
  }

  private static handleVersionMismatchError(
    error: VersionMismatchError,
    _context?: Record<string, any>,
  ): ImportResult {
    const code = error.canMigrate ? "VERSION_CAN_MIGRATE" : "VERSION_MISMATCH";
    const userFriendlyError = createUserFriendlyError(
      code,
      error.message,
      {
        detectedVersion: error.detectedVersion,
        supportedVersions: error.supportedVersions.join(", "),
        ..._context,
      },
    );

    return createImportResult(false, {
      errors: [createValidationError(
        "version",
        userFriendlyError.message,
        error.code,
        {
          value: error.detectedVersion,
          expected: error.supportedVersions.join(" or "),
        },
      )],
      summary: userFriendlyError.action,
    });
  }

  private static handleDataCorruptionError(
    error: DataCorruptionError,
    _context?: Record<string, any>,
  ): ImportResult {
    const partialData = this.extractPartialDataFromCorruption(error);

    return createImportResult(false, {
      errors: error.corruptedFields.map((field) =>
        createValidationError(
          field,
          `Corrupted data in field: ${field}`,
          "CORRUPTED_DATA",
        )
      ),
      partialSuccess: partialData && partialData.recoveredCount > 0,
      recoveredData: partialData,
      summary: partialData
        ? formatImportSummary(
          partialData.totalCount,
          partialData.recoveredCount,
          partialData.totalCount - partialData.recoveredCount,
          0,
        )
        : "Import failed due to data corruption",
    });
  }

  private static handleSecurityError(
    error: SecurityError,
    _context?: Record<string, any>,
  ): ImportResult {
    const userFriendlyError = createUserFriendlyError(
      "SECURITY_VALIDATION_FAILED",
      error.message,
      {
        securityIssue: error.securityIssue,
        recommendation: error.recommendation,
      },
    );

    return createImportResult(false, {
      errors: [createValidationError(
        "security",
        userFriendlyError.message,
        error.code,
      )],
      summary: userFriendlyError.action,
    });
  }

  private static handleGenericExportError(
    error: ExportError,
    _context?: Record<string, any>,
  ): ImportResult {
    // Create a mock translation function for tests/cases without i18n
    const mockT = (key: string) => {
      // Basic error message mapping for the error handler
      const messages: Record<string, string> = {
        "errors.export.format_error":
          "The selected export format is not available",
        "errors.export.format_error_action": "Choose a different export format",
        "errors.general.memory_error": "The operation requires too much memory",
        "errors.general.memory_error_action":
          "Try with a smaller dataset or refresh the page",
        "errors.general.network_error":
          "Unable to complete the operation due to network issues",
        "errors.general.network_error_action":
          "Check your internet connection and try again",
      };
      return messages[key] || key;
    };

    const userFriendlyError = createUserFriendlyError(
      error.code,
      error.message,
      mockT,
      { ...error.context },
    );

    return createImportResult(false, {
      errors: [createValidationError(
        "general",
        userFriendlyError.message,
        error.code,
      )],
      summary: userFriendlyError.action,
    });
  }

  private static handleUnknownError(
    error: unknown,
    _context?: Record<string, any>,
  ): ImportResult {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Create a mock translation function for tests/cases without i18n
    const mockT = (key: string) => {
      if (key === "errors.general.unknown") return "Something went wrong";
      if (key === "errors.general.unknown_action") {
        return "Please try again or contact support if the problem persists";
      }
      return key; // Fallback to key if no translation found
    };

    const userFriendlyError = createUserFriendlyError(
      "UNKNOWN_ERROR",
      errorMessage,
      mockT,
    );

    console.error("Unknown import error:", error);

    return createImportResult(false, {
      errors: [createValidationError(
        "unknown",
        userFriendlyError.message,
        "UNKNOWN_ERROR",
      )],
      summary: userFriendlyError.action,
    });
  }

  static extractPartialData(
    error: ImportValidationError,
  ): PartialImportData | null {
    if (!error.context || !error.context.rawData) {
      return null;
    }

    try {
      const rawData = error.context.rawData;
      const validMeetings: any[] = [];
      const validAttendees: any[] = [];
      const invalidMeetings: any[] = [];
      const invalidAttendees: any[] = [];
      const errors: ValidationErrorDetail[] = [];

      // Attempt to recover valid meetings
      if (Array.isArray(rawData.meetings)) {
        rawData.meetings.forEach((meeting: any, index: number) => {
          if (this.isValidMeeting(meeting)) {
            validMeetings.push(meeting);
          } else {
            invalidMeetings.push(meeting);
            errors.push(createValidationError(
              `meetings[${index}]`,
              "Invalid meeting data",
              "INVALID_MEETING_DATA",
            ));
          }
        });
      }

      // Attempt to recover valid attendees
      if (Array.isArray(rawData.attendees)) {
        rawData.attendees.forEach((attendee: any, index: number) => {
          if (this.isValidAttendee(attendee)) {
            validAttendees.push(attendee);
          } else {
            invalidAttendees.push(attendee);
            errors.push(createValidationError(
              `attendees[${index}]`,
              "Invalid attendee data",
              "INVALID_ATTENDEE_DATA",
            ));
          }
        });
      }

      const recoveredCount = validMeetings.length + validAttendees.length;
      const totalCount = (rawData.meetings?.length || 0) +
        (rawData.attendees?.length || 0);

      return {
        validMeetings,
        validAttendees,
        invalidMeetings,
        invalidAttendees,
        recoveredCount,
        totalCount,
        errors,
      };
    } catch (err) {
      console.error("Error extracting partial data:", err);
      return null;
    }
  }

  private static extractPartialDataFromCorruption(
    error: DataCorruptionError,
  ): PartialImportData | null {
    if (!error.partialData) {
      return null;
    }

    try {
      const partialData = error.partialData;
      const validMeetings = partialData.validMeetings || [];
      const validAttendees = partialData.validAttendees || [];
      const recoveredCount = validMeetings.length + validAttendees.length;

      return {
        validMeetings,
        validAttendees,
        invalidMeetings: [],
        invalidAttendees: [],
        recoveredCount,
        totalCount: recoveredCount, // We only have partial data
        errors: error.corruptedFields.map((field) =>
          createValidationError(
            field,
            `Corrupted field: ${field}`,
            "CORRUPTED_DATA",
          )
        ),
      };
    } catch (err) {
      console.error("Error extracting partial data from corruption:", err);
      return null;
    }
  }

  private static isValidMeeting(meeting: any): boolean {
    return !!(
      meeting &&
      typeof meeting.id === "string" &&
      typeof meeting.title === "string" &&
      typeof meeting.date === "string" &&
      Array.isArray(meeting.blocks) &&
      Array.isArray(meeting.attendeeIds)
    );
  }

  private static isValidAttendee(attendee: any): boolean {
    return !!(
      attendee &&
      typeof attendee.id === "string" &&
      typeof attendee.name === "string" &&
      attendee.name.trim().length > 0
    );
  }

  static async attemptPartialImport(
    data: any,
    validationErrors: ValidationErrorDetail[],
  ): Promise<PartialImportData> {
    const validMeetings: any[] = [];
    const validAttendees: any[] = [];
    const invalidMeetings: any[] = [];
    const invalidAttendees: any[] = [];
    const errors: ValidationErrorDetail[] = [...validationErrors];

    // Process meetings
    if (Array.isArray(data.meetings)) {
      data.meetings.forEach((meeting: any, index: number) => {
        if (this.isValidMeeting(meeting)) {
          validMeetings.push(meeting);
        } else {
          invalidMeetings.push(meeting);
          errors.push(createValidationError(
            `meetings[${index}]`,
            "Meeting validation failed",
            "INVALID_MEETING_DATA",
          ));
        }
      });
    }

    // Process attendees
    if (Array.isArray(data.attendees)) {
      data.attendees.forEach((attendee: any, index: number) => {
        if (this.isValidAttendee(attendee)) {
          validAttendees.push(attendee);
        } else {
          invalidAttendees.push(attendee);
          errors.push(createValidationError(
            `attendees[${index}]`,
            "Attendee validation failed",
            "INVALID_ATTENDEE_DATA",
          ));
        }
      });
    }

    const recoveredCount = validMeetings.length + validAttendees.length;
    const totalCount = (data.meetings?.length || 0) +
      (data.attendees?.length || 0);

    return {
      validMeetings,
      validAttendees,
      invalidMeetings,
      invalidAttendees,
      recoveredCount,
      totalCount,
      errors,
    };
  }

  static validateFileBeforeProcessing(file: File): void {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new FileProcessingError(
        `File size ${file.size} exceeds maximum ${this.MAX_FILE_SIZE}`,
        file.type,
        file.name,
        file.size,
      );
    }

    // Check MIME type
    if (
      !this.SUPPORTED_MIME_TYPES.includes(file.type) &&
      !file.name.endsWith(".json")
    ) {
      throw new FileProcessingError(
        `Unsupported file type: ${file.type}`,
        file.type,
        file.name,
        file.size,
      );
    }
  }

  static async safeJsonParse(content: string): Promise<any> {
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new DataCorruptionError(
        `JSON parsing failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        ["json_structure"],
        null,
      );
    }
  }

  static createProgressCallback(
    onProgress?: (progress: number, status: string) => void,
  ): (progress: number, status: string) => void {
    return (progress: number, status: string) => {
      if (onProgress) {
        onProgress(Math.min(100, Math.max(0, progress)), status);
      }
    };
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  static createRecoveryOptions(error: ExportError): {
    canRetry: boolean;
    canPartialImport: boolean;
    suggestedAction: string;
  } {
    return {
      canRetry: error.recoverable,
      canPartialImport: isImportValidationError(error) ||
        isDataCorruptionError(error),
      suggestedAction: formatActionMessage(error.code, error.context),
    };
  }
}
