import { z } from "zod";
import { MeetingArraySchema, MeetingSchema } from "./meeting";

// Series schema for workspace-level meeting series
export const MeetingSeriesSchema = z.object({
  title: z.string()
    .trim()
    .min(1, "Series title is required")
    .max(280, "Series title must not exceed 280 characters"),
  agenda: z.string()
    .max(600, "Series agenda must not exceed 600 characters")
    .default(""),
  meetings: MeetingArraySchema,
  created_at: z.string().datetime("Invalid datetime format for created_at"),
  updated_at: z.string().datetime("Invalid datetime format for updated_at"),
}).strict();

// Infer TypeScript type from schema
export type MeetingSeriesType = z.infer<typeof MeetingSeriesSchema>;

// Schema for updating series (partial updates)
export const UpdateSeriesSchema = MeetingSeriesSchema.partial().extend({
  // Always update the timestamp when updating
  updated_at: z.string().datetime().default(() => new Date().toISOString()),
});

// Schema for creating new series
export const CreateSeriesSchema = MeetingSeriesSchema.omit({
  created_at: true,
  updated_at: true,
}).extend({
  // Optional overrides for creation
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  // Set defaults
  title: z.string()
    .trim()
    .min(1, "Series title is required")
    .max(280, "Series title must not exceed 280 characters")
    .default("New Meeting Series"),
  agenda: z.string()
    .max(600, "Series agenda must not exceed 600 characters")
    .default(""),
  meetings: MeetingArraySchema.default([]),
});

// Legacy schema for migration - handles existing localStorage data structure
export const LegacyMeetingsArraySchema = z.array(MeetingSchema);

// Schema for series data that might be missing timestamps
export const MigrationSeriesSchema = z.object({
  title: z.string()
    .trim()
    .min(1, "Series title is required")
    .max(280, "Series title must not exceed 280 characters")
    .default("New Meeting Series"),
  agenda: z.string()
    .max(600, "Series agenda must not exceed 600 characters")
    .default(""),
  meetings: MeetingArraySchema.default([]),
  created_at: z.string().datetime().default(() => new Date().toISOString()),
  updated_at: z.string().datetime().default(() => new Date().toISOString()),
}).strict();

// Validation utilities
export function validateMeetingSeries(
  series: unknown,
): series is MeetingSeriesType {
  return MeetingSeriesSchema.safeParse(series).success;
}

export function parseMeetingSeries(series: unknown): MeetingSeriesType {
  return MeetingSeriesSchema.parse(series);
}

export function parseMeetingSeriesSafe(
  series: unknown,
): { success: true; data: MeetingSeriesType } | {
  success: false;
  error: z.ZodError;
} {
  const result = MeetingSeriesSchema.safeParse(series);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
}

// Migration utility for converting legacy meetings array to series format
export function migrateLegacyMeetingsToSeries(
  data: unknown,
): MeetingSeriesType {
  // If it's already a series object, validate and return
  if (typeof data === "object" && data !== null && "title" in data) {
    return MigrationSeriesSchema.parse(data);
  }

  // If it's an array (legacy format), convert to series
  if (Array.isArray(data)) {
    const meetings = LegacyMeetingsArraySchema.parse(data);
    const now = new Date().toISOString();

    return {
      title: "New Meeting Series",
      agenda: "",
      meetings,
      created_at: now,
      updated_at: now,
    };
  }

  // Invalid data format
  throw new Error(
    "Invalid data format: expected meetings array or series object",
  );
}

// Utility to validate series data integrity
export function validateSeriesIntegrity(
  series: unknown,
): { valid: boolean; errors: string[] } {
  const result = MeetingSeriesSchema.safeParse(series);
  if (result.success) {
    return { valid: true, errors: [] };
  }

  const errors = result.error.issues.map((err) =>
    `${err.path.join(".")}: ${err.message}`
  );

  return { valid: false, errors };
}

// Helper to create a default series
export function createDefaultSeries(): MeetingSeriesType {
  const now = new Date().toISOString();
  return {
    title: "New Meeting Series",
    agenda: "",
    meetings: [],
    created_at: now,
    updated_at: now,
  };
}

// Helper to update series with validation
export function updateSeriesData(
  currentSeries: MeetingSeriesType,
  updates: Partial<Pick<MeetingSeriesType, "title" | "agenda">>,
): MeetingSeriesType {
  const updated = {
    ...currentSeries,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  return MeetingSeriesSchema.parse(updated);
}
