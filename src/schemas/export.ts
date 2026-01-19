import { z } from "zod";
import { MeetingArraySchema } from "./meeting";
import { AttendeeArraySchema } from "./attendee";
import {
  _DataCorruptionError,
  _VersionMismatchError,
  createValidationError,
  ValidationErrorDetail,
  ValidationResult,
} from "../utils/export/errors/ExportErrors";

// Version schema for semantic versioning
export const VersionSchema = z.string().regex(
  /^\d+\.\d+\.\d+$/,
  "Version must follow semantic versioning (e.g., 1.0.0)",
);

// Export metadata schema
export const ExportMetadataSchema = z.object({
  appVersion: z.string().min(1, "App version is required"),
  totalMeetings: z.number().int().min(0, "Total meetings must be non-negative"),
  blockTypes: z.array(z.string()).min(0, "Block types must be an array"),
  exportedBy: z.string().optional(), // Future: user identification
  exportReason: z.string().optional(), // Future: backup, migration, sharing, etc.
  includesAttendees: z.boolean().default(true),
  includesTopicGroups: z.boolean().default(true),
}).strict();

// v1.0.0 export format with attendees and meetings
export const ExportV1Schema = z.object({
  version: z.literal("1.0.0"),
  exportedAt: z.string().datetime("Invalid datetime format for exportedAt"),
  attendees: AttendeeArraySchema,
  title: z.string().min(1, "Export title is required"),
  agenda: z.string().optional(),
  meetings: MeetingArraySchema,
  metadata: ExportMetadataSchema.extend({
    totalAttendees: z.number().int().min(
      0,
      "Total attendees must be non-negative",
    ),
  }),
}).strict();

// Legacy format (meetings array only) for backward compatibility
export const LegacyExportSchema = MeetingArraySchema;

// Union type for all supported export formats (auto-generated from EXPORT_SCHEMAS)
export const ExportSchema = z.union([
  ExportV1Schema,
  LegacyExportSchema,
]);

// Future: This could be auto-generated like:
// export const ExportSchema = z.union(EXPORT_SCHEMAS.map(s => s.schema));

// Schema for import/export operations
export const ImportOptionsSchema = z.object({
  validateIntegrity: z.boolean().default(true),
  mergeDuplicates: z.boolean().default(false),
  preserveIds: z.boolean().default(true),
  skipInvalidBlocks: z.boolean().default(true),
  skipInvalidMeetings: z.boolean().default(false),
}).strict();

export const ExportOptionsSchema = z.object({
  format: z.enum(["v1", "v2"]).default("v1"),
  includeMetadata: z.boolean().default(true),
  prettify: z.boolean().default(true),
  includeAttendees: z.boolean().default(true),
  includeTopicGroups: z.boolean().default(true),
  dateRange: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }).optional(),
}).strict();

// Type inference
export type ExportV1Type = z.infer<typeof ExportV1Schema>;
export type LegacyExportType = z.infer<typeof LegacyExportSchema>;
export type ExportType = z.infer<typeof ExportSchema>;
export type ImportOptionsType = z.infer<typeof ImportOptionsSchema>;
export type ExportOptionsType = z.infer<typeof ExportOptionsSchema>;

// Supported export schemas in order of preference (newest first)
const EXPORT_SCHEMAS = [
  { version: "1.0.0", schema: ExportV1Schema },
  { version: "legacy", schema: LegacyExportSchema },
] as const;

// Version detection utilities
export function detectExportVersion(data: unknown): string {
  // Check schemas in order (newest first)
  for (const { version, schema } of EXPORT_SCHEMAS) {
    if (schema.safeParse(data).success) {
      return version;
    }
  }

  throw new Error("Unsupported or invalid export format");
}

// Enhanced validation utilities with detailed error information
export function validateExport(data: unknown): {
  valid: boolean;
  version: string | null;
  errors: string[];
} {
  try {
    const version = detectExportVersion(data);
    return { valid: true, version, errors: [] };
  } catch (error) {
    return {
      valid: false,
      version: null,
      errors: [
        error instanceof Error ? error.message : "Unknown validation error",
      ],
    };
  }
}

// Enhanced validation with detailed error reporting
export function validateExportData(data: unknown): ValidationResult {
  try {
    const _version = detectExportVersion(data);
    const result = ExportSchema.safeParse(data);

    if (result.success) {
      return {
        valid: true,
        data: result.data,
      };
    }

    // Convert Zod errors to detailed validation errors
    const errors: ValidationErrorDetail[] = result.error.issues.map((issue) => {
      const field = issue.path.join(".");
      const message = getHumanReadableError(issue);
      const line = extractLineNumber(issue);

      return createValidationError(field, message, issue.code, {
        line,
        value: issue.received || "unknown",
        expected: getExpectedValue(issue),
      });
    });

    return {
      valid: false,
      errors,
    };
  } catch (error) {
    // Handle version detection errors
    if (error instanceof Error) {
      return {
        valid: false,
        errors: [createValidationError(
          "version",
          error.message,
          "version_detection_failed",
        )],
      };
    }

    return {
      valid: false,
      errors: [createValidationError(
        "unknown",
        "Unknown validation error occurred",
        "unknown_error",
      )],
    };
  }
}

// Helper function to convert Zod issues to human-readable messages
function getHumanReadableError(_issue: z.ZodIssue): string {
  const field = _issue.path.join(".");

  switch (_issue.code) {
    case z.ZodIssueCode.invalid_type:
      return `Expected ${_issue.expected} but received ${_issue.received} for field '${field}'`;
    case z.ZodIssueCode.invalid_string:
      return `Invalid string format for field '${field}': ${_issue.message}`;
    case z.ZodIssueCode.too_small:
      return `Field '${field}' is too small: ${_issue.message}`;
    case z.ZodIssueCode.too_big:
      return `Field '${field}' is too large: ${_issue.message}`;
    case z.ZodIssueCode.invalid_enum_value:
      return `Invalid value for field '${field}': expected one of ${
        _issue.options?.join(", ")
      }`;
    case z.ZodIssueCode.invalid_date:
      return `Invalid date format for field '${field}': ${_issue.message}`;
    case z.ZodIssueCode.custom:
      return _issue.message || `Custom validation failed for field '${field}'`;
    default:
      return _issue.message || `Validation failed for field '${field}'`;
  }
}

// Helper function to extract line number from Zod issue (if available)
function extractLineNumber(_issue: z.ZodIssue): number | undefined {
  // This is a placeholder - in a real implementation, you might need to
  // track line numbers during JSON parsing or use a custom parser
  return undefined;
}

// Helper function to get expected value description
function getExpectedValue(issue: z.ZodIssue): string {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      return issue.expected;
    case z.ZodIssueCode.invalid_enum_value:
      return issue.options?.join(" | ") || "valid enum value";
    case z.ZodIssueCode.too_small:
      return `minimum ${issue.minimum}`;
    case z.ZodIssueCode.too_big:
      return `maximum ${issue.maximum}`;
    default:
      return "valid value";
  }
}

// Enhanced version detection with better error handling
export function detectExportVersionSafe(data: unknown): {
  version: string | null;
  canMigrate: boolean;
  supportedVersions: string[];
  errors: ValidationErrorDetail[];
} {
  const supportedVersions = EXPORT_SCHEMAS.map((schema) => schema.version);
  const errors: ValidationErrorDetail[] = [];

  // Check if data is an object
  if (!data || typeof data !== "object") {
    errors.push(createValidationError(
      "root",
      "Export data must be an object",
      "invalid_type",
    ));

    return {
      version: null,
      canMigrate: false,
      supportedVersions,
      errors,
    };
  }

  // Check for explicit version field
  const dataObj = data as any;
  if (dataObj.version) {
    const explicitVersion = dataObj.version;
    const isSupported = supportedVersions.includes(explicitVersion);

    if (!isSupported) {
      errors.push(createValidationError(
        "version",
        `Version '${explicitVersion}' is not supported`,
        "unsupported_version",
        { value: explicitVersion, expected: supportedVersions.join(" | ") },
      ));

      return {
        version: explicitVersion,
        canMigrate: false,
        supportedVersions,
        errors,
      };
    }
  }

  // Try to detect version by schema validation
  for (const { version: detectedVersion, schema } of EXPORT_SCHEMAS) {
    const result = schema.safeParse(data);
    if (result.success) {
      return {
        version: detectedVersion,
        canMigrate: true,
        supportedVersions,
        errors: [],
      };
    }
  }

  // If no version could be detected, but it looks like meeting data
  if (Array.isArray(data) && data.length > 0) {
    // Might be legacy format
    return {
      version: "legacy",
      canMigrate: true,
      supportedVersions,
      errors: [],
    };
  }

  errors.push(createValidationError(
    "format",
    "Unable to detect export format",
    "unknown_format",
  ));

  return {
    version: null,
    canMigrate: false,
    supportedVersions,
    errors,
  };
}

export function parseExport(data: unknown): ExportType {
  return ExportSchema.parse(data);
}

export function parseExportSafe(data: unknown): {
  success: true;
  data: ExportType;
  version: string;
} | {
  success: false;
  error: z.ZodError;
} {
  try {
    const version = detectExportVersion(data);
    const result = ExportSchema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data, version };
    }
    return { success: false, error: result.error };
  } catch (error) {
    // Create a ZodError-like object for consistency
    const zodError = new z.ZodError([{
      code: z.ZodIssueCode.custom,
      message: error instanceof Error
        ? error.message
        : "Version detection failed",
      path: ["version"],
    }]);

    return { success: false, error: zodError };
  }
}

// Enhanced parsing with detailed error reporting
export function parseExportWithDetails(data: unknown): {
  success: true;
  data: ExportType;
  version: string;
  warnings?: ValidationErrorDetail[];
} | {
  success: false;
  errors: ValidationErrorDetail[];
  partialData?: any;
  recoverable: boolean;
} {
  const validationResult = validateExportData(data);

  if (validationResult.valid) {
    const detectedVersion = detectExportVersion(data);
    return {
      success: true,
      data: validationResult.data!,
      version: detectedVersion,
      warnings: validationResult.warnings,
    };
  }

  // Try to extract partial data for recovery
  const partialData = attemptPartialDataExtraction(data);
  const recoverable = partialData !== null;

  return {
    success: false,
    errors: validationResult.errors || [],
    partialData,
    recoverable,
  };
}

// Helper function to attempt partial data extraction
function attemptPartialDataExtraction(data: unknown): any {
  if (!data || typeof data !== "object") {
    return null;
  }

  const dataObj = data as any;
  const partial: any = {};

  // Try to extract valid meetings
  if (Array.isArray(dataObj.meetings)) {
    const validMeetings = dataObj.meetings.filter((meeting: any) => {
      return meeting &&
        typeof meeting.id === "string" &&
        typeof meeting.title === "string" &&
        Array.isArray(meeting.blocks);
    });

    if (validMeetings.length > 0) {
      partial.meetings = validMeetings;
    }
  }

  // Try to extract valid attendees
  if (Array.isArray(dataObj.attendees)) {
    const validAttendees = dataObj.attendees.filter((attendee: any) => {
      return attendee &&
        typeof attendee.id === "string" &&
        typeof attendee.name === "string" &&
        attendee.name.trim().length > 0;
    });

    if (validAttendees.length > 0) {
      partial.attendees = validAttendees;
    }
  }

  // If we have some valid data, return it
  return Object.keys(partial).length > 0 ? partial : null;
}

// Helper function to create v1.0.0 export with attendees and meetings
export function createExportV1(
  meetings: z.infer<typeof MeetingArraySchema>,
  attendees: z.infer<typeof AttendeeArraySchema>,
  seriesTitle: string = "Meeting Series",
  seriesAgenda: string = "",
  options: Partial<ExportOptionsType> = {},
): ExportV1Type {
  const opts = ExportOptionsSchema.parse(options);

  return {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    title: seriesTitle,
    agenda: seriesAgenda,
    attendees,
    meetings,
    metadata: {
      appVersion: "1.0.0",
      totalMeetings: meetings.length,
      totalAttendees: attendees.length,
      blockTypes: [
        ...new Set(meetings.flatMap((m) => m.blocks.map((b) => b.type))),
      ],
      includesAttendees: opts.includeAttendees,
      includesTopicGroups: opts.includeTopicGroups,
    },
  };
}

// Utility function to create sanitized filename from series title
export function createExportFilename(seriesTitle: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const sanitizedTitle = seriesTitle
    .slice(0, 30) // Limit to first 30 characters
    .replace(/[^a-zA-Z0-9-_\s]/g, "") // Remove special characters
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .toLowerCase()
    .trim(); // Remove any trailing whitespace

  // Fallback to 'neetings-backup' if title becomes empty after sanitization
  const titlePart = sanitizedTitle || "neetings_backup";

  return `${titlePart}_${date}.json`;
}

// Utility to normalize legacy exports to current format
export function normalizeExportToV1(data: unknown): ExportV1Type {
  const version = detectExportVersion(data);

  switch (version) {
    case "1.0.0":
      return ExportV1Schema.parse(data);

    case "legacy": {
      const meetings = LegacyExportSchema.parse(data);
      return createExportV1(meetings, []); // No attendees in legacy format
    }

    default:
      throw new Error(`Cannot normalize unsupported version: ${version}`);
  }
}
