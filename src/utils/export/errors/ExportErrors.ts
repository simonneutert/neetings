export class ExportError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public recoverable: boolean = false,
    public context?: Record<string, any>,
  ) {
    super(message);
    this.name = "ExportError";
  }
}

export class ImportValidationError extends ExportError {
  constructor(
    public validationErrors: ValidationErrorDetail[],
    public line?: number,
    public field?: string,
  ) {
    super(
      `Validation failed: ${validationErrors.map((e) => e.message).join(", ")}`,
      "IMPORT_VALIDATION_ERROR",
      "The imported file contains invalid data",
      true,
      { validationErrors, line, field },
    );
    this.name = "ImportValidationError";
  }
}

export class FileProcessingError extends ExportError {
  constructor(
    message: string,
    public fileType: string,
    public fileName?: string,
    public fileSize?: number,
  ) {
    super(
      message,
      "FILE_PROCESSING_ERROR",
      "Unable to process the selected file",
      false,
      { fileType, fileName, fileSize },
    );
    this.name = "FileProcessingError";
  }
}

export class VersionMismatchError extends ExportError {
  constructor(
    public detectedVersion: string,
    public supportedVersions: string[],
    public canMigrate: boolean = false,
  ) {
    super(
      `Version mismatch: detected ${detectedVersion}, supported: ${
        supportedVersions.join(", ")
      }`,
      "VERSION_MISMATCH_ERROR",
      canMigrate
        ? "This file is from an older version but can be updated"
        : "This file is from an unsupported version",
      canMigrate,
      { detectedVersion, supportedVersions, canMigrate },
    );
    this.name = "VersionMismatchError";
  }
}

export class DataCorruptionError extends ExportError {
  constructor(
    message: string,
    public corruptedFields: string[],
    public partialData?: any,
  ) {
    super(
      message,
      "DATA_CORRUPTION_ERROR",
      "The file contains corrupted or incomplete data",
      partialData != null,
      { corruptedFields, partialData },
    );
    this.name = "DataCorruptionError";
  }
}

export class SecurityError extends ExportError {
  constructor(
    message: string,
    public securityIssue: string,
    public recommendation: string,
  ) {
    super(
      message,
      "SECURITY_ERROR",
      "Security validation failed",
      false,
      { securityIssue, recommendation },
    );
    this.name = "SecurityError";
  }
}

export class ExportFormatError extends ExportError {
  constructor(
    message: string,
    public format: string,
    public supportedFormats: string[],
  ) {
    super(
      message,
      "EXPORT_FORMAT_ERROR",
      "The selected export format is not supported",
      true,
      { format, supportedFormats },
    );
    this.name = "ExportFormatError";
  }
}

export class MemoryError extends ExportError {
  constructor(
    message: string,
    public operation: string,
    public dataSize: number,
    public memoryLimit: number,
  ) {
    super(
      message,
      "MEMORY_ERROR",
      "The file is too large to process",
      false,
      { operation, dataSize, memoryLimit },
    );
    this.name = "MemoryError";
  }
}

export class NetworkError extends ExportError {
  constructor(
    message: string,
    public operation: string,
    public retryable: boolean = true,
  ) {
    super(
      message,
      "NETWORK_ERROR",
      "Network operation failed",
      retryable,
      { operation, retryable },
    );
    this.name = "NetworkError";
  }
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
  line?: number;
  value?: any;
  expected?: string;
}

export interface ImportResult {
  success: boolean;
  partialSuccess?: boolean;
  imported?: any;
  errors?: ValidationErrorDetail[];
  warnings?: ValidationErrorDetail[];
  summary?: string;
  recoveredData?: any;
  failedItems?: number;
  totalItems?: number;
  processingTime?: number;
}

export interface ExportResult {
  success: boolean;
  data?: any;
  format?: string;
  size?: number;
  errors?: ValidationErrorDetail[];
  warnings?: ValidationErrorDetail[];
  processingTime?: number;
}

export interface PartialImportData {
  validMeetings: any[];
  validAttendees: any[];
  invalidMeetings: any[];
  invalidAttendees: any[];
  recoveredCount: number;
  totalCount: number;
  errors: ValidationErrorDetail[];
}

export interface ValidationResult {
  valid: boolean;
  data?: any;
  errors?: ValidationErrorDetail[];
  warnings?: ValidationErrorDetail[];
  partialData?: PartialImportData;
}

export function isExportError(error: any): error is ExportError {
  return error instanceof ExportError;
}

export function isImportValidationError(
  error: any,
): error is ImportValidationError {
  return error instanceof ImportValidationError;
}

export function isFileProcessingError(
  error: any,
): error is FileProcessingError {
  return error instanceof FileProcessingError;
}

export function isVersionMismatchError(
  error: any,
): error is VersionMismatchError {
  return error instanceof VersionMismatchError;
}

export function isDataCorruptionError(
  error: any,
): error is DataCorruptionError {
  return error instanceof DataCorruptionError;
}

export function isSecurityError(error: any): error is SecurityError {
  return error instanceof SecurityError;
}

export function createValidationError(
  field: string,
  message: string,
  code: string,
  options?: {
    line?: number;
    value?: any;
    expected?: string;
  },
): ValidationErrorDetail {
  return {
    field,
    message,
    code,
    line: options?.line,
    value: options?.value,
    expected: options?.expected,
  };
}

export function createImportResult(
  success: boolean,
  options?: {
    imported?: any;
    errors?: ValidationErrorDetail[];
    warnings?: ValidationErrorDetail[];
    summary?: string;
    partialSuccess?: boolean;
    recoveredData?: any;
    failedItems?: number;
    totalItems?: number;
    processingTime?: number;
  },
): ImportResult {
  return {
    success,
    partialSuccess: options?.partialSuccess,
    imported: options?.imported,
    errors: options?.errors,
    warnings: options?.warnings,
    summary: options?.summary,
    recoveredData: options?.recoveredData,
    failedItems: options?.failedItems,
    totalItems: options?.totalItems,
    processingTime: options?.processingTime,
  };
}

export function createExportResult(
  success: boolean,
  options?: {
    data?: any;
    format?: string;
    size?: number;
    errors?: ValidationErrorDetail[];
    warnings?: ValidationErrorDetail[];
    processingTime?: number;
  },
): ExportResult {
  return {
    success,
    data: options?.data,
    format: options?.format,
    size: options?.size,
    errors: options?.errors,
    warnings: options?.warnings,
    processingTime: options?.processingTime,
  };
}

export interface ImportOptions {
  validateSchemas?: boolean;
  allowPartialImport?: boolean;
  maxFileSize?: number;
  timeoutMs?: number;
}

export function createImportOptions(
  options?: Partial<ImportOptions>,
): ImportOptions {
  return {
    validateSchemas: true,
    allowPartialImport: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    timeoutMs: 30000, // 30 seconds
    ...options,
  };
}
