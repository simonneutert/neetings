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
  };
}
