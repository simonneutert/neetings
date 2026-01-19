import { z } from "zod";
import { BlockArraySchema, BlockSchema } from "./block";
import { TopicGroupArraySchema, TopicGroupSchema } from "./topicGroup";

// Meeting schema
export const MeetingSchema = z.object({
  id: z.string().min(1, "Meeting ID is required"),
  title: z.string(), //.min(1, "Meeting title is required"),
  date: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must be in YYYY-MM-DD format",
  ),
  startTime: z.string(),
  endTime: z.string(),
  blocks: BlockArraySchema,
  topicGroups: TopicGroupArraySchema.optional(), // Optional for backward compatibility
  attendeeIds: z.array(z.string()), // References to global attendees
  created_at: z.string().datetime("Invalid datetime format for created_at"),
  updated_at: z.string().datetime("Invalid datetime format for updated_at"),
}).strict();

// Infer TypeScript type from schema
export type MeetingSchemaType = z.infer<typeof MeetingSchema>;

// Meeting filters schema
export const MeetingFiltersSchema = z.object({
  dateFrom: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must be in YYYY-MM-DD format",
  ),
  dateTo: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must be in YYYY-MM-DD format",
  ),
  selectedFilters: z.array(z.string()),
}).strict();

// Meeting update data schema (partial meeting without id and created_at)
export const MeetingUpdateDataSchema = MeetingSchema.omit({
  id: true,
  created_at: true,
}).partial();

// Schema for creating new meetings (without generated fields)
export const CreateMeetingSchema = MeetingSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  // Optional overrides for creation
  id: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  // Set defaults for optional arrays
  blocks: BlockArraySchema.default([]),
  topicGroups: TopicGroupArraySchema.default([]),
  attendeeIds: z.array(z.string()).default([]),
});

// Schema for updating meetings (all fields optional except id)
export const UpdateMeetingSchema = MeetingSchema.partial().extend({
  id: z.string().min(1, "Meeting ID is required for updates"),
});

// Array of meetings schema
export const MeetingArraySchema = z.array(MeetingSchema);

// Validation utilities
export function validateMeeting(
  meeting: unknown,
): meeting is MeetingSchemaType {
  return MeetingSchema.safeParse(meeting).success;
}

export function parseMeeting(meeting: unknown): MeetingSchemaType {
  return MeetingSchema.parse(meeting);
}

export function parseMeetingSafe(
  meeting: unknown,
): { success: true; data: MeetingSchemaType } | {
  success: false;
  error: z.ZodError;
} {
  const result = MeetingSchema.safeParse(meeting);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
}

// Migration helper for meetings without required fields or with legacy structure
export const LegacyMeetingSchema = z.object({
  id: z.string().default(() =>
    crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36)
  ),
  title: z.string().min(1, "Meeting title is required"),
  date: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must be in YYYY-MM-DD format",
  ),
  startTime: z.string().default(""),
  endTime: z.string().default(""),
  blocks: BlockArraySchema.default([]),
  topicGroups: TopicGroupArraySchema.default([]), // Ensure it exists
  attendeeIds: z.array(z.string()).default([]), // Ensure it exists
  created_at: z.string().datetime().default(() => new Date().toISOString()),
  updated_at: z.string().datetime().default(() => new Date().toISOString()),
}).strict();

export function migrateLegacyMeeting(meeting: unknown): MeetingSchemaType {
  return LegacyMeetingSchema.parse(meeting);
}

// Schema for meetings with enhanced validation (strict mode for production)
export const StrictMeetingSchema = MeetingSchema.extend({
  title: z.string().trim().min(1, "Meeting title cannot be empty"),
  blocks: z.array(BlockSchema).min(0, "Blocks must be an array"),
  topicGroups: z.array(TopicGroupSchema).min(
    0,
    "Topic groups must be an array",
  ),
  attendeeIds: z.array(z.string().min(1, "Attendee ID cannot be empty")).min(
    0,
    "Attendee IDs must be an array",
  ),
}).refine(
  (meeting) => {
    // Ensure all blocks belong to valid topic groups or null
    const topicGroupIds = new Set(
      meeting.topicGroups?.map((tg) => tg.id) || [],
    );
    return meeting.blocks.every((block) =>
      block.topicGroupId === null || topicGroupIds.has(block.topicGroupId)
    );
  },
  {
    message:
      "All blocks must reference valid topic groups or be unassigned (null)",
    path: ["blocks"],
  },
).refine(
  (meeting) => {
    // Ensure all topic groups belong to this meeting
    return meeting.topicGroups?.every((tg) => tg.meetingId === meeting.id) ??
      true;
  },
  {
    message: "All topic groups must belong to this meeting",
    path: ["topicGroups"],
  },
);

// Utility to validate meeting data integrity
export function validateMeetingIntegrity(
  meeting: unknown,
): { valid: boolean; errors: string[] } {
  const result = StrictMeetingSchema.safeParse(meeting);
  if (result.success) {
    return { valid: true, errors: [] };
  }

  const errors = result.error.errors.map((err) =>
    `${err.path.join(".")}: ${err.message}`
  );

  return { valid: false, errors };
}
