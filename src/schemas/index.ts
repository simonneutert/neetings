// Central export for all Zod schemas and utilities
export * from "./block.ts";
export * from "./meeting.ts";
export * from "./attendee.ts";
export * from "./topicGroup.ts";
export * from "./export.ts";
export * from "./migrations.ts";

// Re-export commonly used schemas for convenience
export {
  BlockArraySchema,
  BlockSchema,
  migrateLegacyBlock,
  parseBlock,
  parseBlockSafe,
  validateBlock,
} from "./block.ts";

export {
  MeetingArraySchema,
  MeetingSchema,
  migrateLegacyMeeting,
  parseMeeting,
  parseMeetingSafe,
  validateMeeting,
} from "./meeting.ts";

export {
  AttendeeArraySchema,
  AttendeeSchema,
  parseAttendee,
  validateAttendee,
} from "./attendee.ts";

export {
  parseTopicGroup,
  TopicGroupArraySchema,
  TopicGroupSchema,
  validateTopicGroup,
} from "./topicGroup.ts";

export {
  createExportV1,
  detectExportVersion,
  ExportSchema,
  ExportV1Schema,
  LegacyExportSchema,
  normalizeExportToV1,
  parseExport,
  parseExportSafe,
  validateExport,
} from "./export.ts";

export {
  autoMigrate,
  getMigrationInfo,
  getSupportedVersions,
  isMigrationNeeded,
  migrateData,
  rollbackData,
} from "./migrations.ts";

// Version constants - Update these when adding new versions
export const CURRENT_EXPORT_VERSION = "1.0.0";
export const SUPPORTED_VERSIONS = ["1.0.0", "legacy"] as const;
export const LEGACY_VERSION = "legacy";

// Future-proof version utilities
export function isVersionSupported(version: string): boolean {
  return SUPPORTED_VERSIONS.includes(version as any);
}

export function getLatestVersion(): string {
  return CURRENT_EXPORT_VERSION;
}

// Common validation options
export const DEFAULT_IMPORT_OPTIONS = {
  validateIntegrity: true,
  mergeDuplicates: false,
  preserveIds: true,
  skipInvalidBlocks: true,
  skipInvalidMeetings: false,
};

export const DEFAULT_EXPORT_OPTIONS = {
  format: "v1" as const,
  includeMetadata: true,
  prettify: true,
  includeAttendees: true,
  includeTopicGroups: true,
};
