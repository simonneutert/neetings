import { z } from "zod";

// Topic Group schema
export const TopicGroupSchema = z.object({
  id: z.string().min(1, "Topic group ID is required"),
  name: z.string().min(1, "Topic group name is required"),
  color: z.string().optional(),
  order: z.number().int().min(0, "Order must be a non-negative integer"),
  meetingId: z.string().min(1, "Meeting ID is required"),
  createdAt: z.string().datetime("Invalid datetime format for createdAt"),
  updatedAt: z.string().datetime("Invalid datetime format for updatedAt"),
}).strict();

// Infer TypeScript type from schema
export type TopicGroupSchemaType = z.infer<typeof TopicGroupSchema>;

// Schema for creating new topic groups (without generated fields)
export const CreateTopicGroupSchema = TopicGroupSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Optional overrides for creation
  id: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// Schema for updating topic groups (all fields optional except id)
export const UpdateTopicGroupSchema = TopicGroupSchema.partial().extend({
  id: z.string().min(1, "Topic group ID is required for updates"),
});

// Array of topic groups schema
export const TopicGroupArraySchema = z.array(TopicGroupSchema);

// Default topic group template schema
export const DefaultTopicGroupTemplateSchema = z.object({
  name: z.string().min(1),
  color: z.string(),
  order: z.number().int().min(0),
});

// Schema for the DEFAULT_TOPIC_GROUPS constant
export const DefaultTopicGroupsSchema = z.record(
  z.string(),
  DefaultTopicGroupTemplateSchema,
);

// Topic group operations schema (for validation of operation parameters)
export const TopicGroupOperationSchema = z.object({
  createTopicGroup: z.object({
    meetingId: z.string().min(1),
    name: z.string().min(1),
    color: z.string().optional(),
  }),
  updateTopicGroup: z.object({
    id: z.string().min(1),
    updates: UpdateTopicGroupSchema.omit({ id: true }),
  }),
  deleteTopicGroup: z.object({
    id: z.string().min(1),
  }),
  reorderTopicGroups: z.object({
    meetingId: z.string().min(1),
    groupIds: z.array(z.string().min(1)),
  }),
});

// Validation utilities
export function validateTopicGroup(
  topicGroup: unknown,
): topicGroup is TopicGroupSchemaType {
  return TopicGroupSchema.safeParse(topicGroup).success;
}

export function parseTopicGroup(topicGroup: unknown): TopicGroupSchemaType {
  return TopicGroupSchema.parse(topicGroup);
}

export function parseTopicGroupSafe(
  topicGroup: unknown,
): { success: true; data: TopicGroupSchemaType } | {
  success: false;
  error: z.ZodError;
} {
  const result = TopicGroupSchema.safeParse(topicGroup);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
}

// Migration helper for topic groups without required fields
export const LegacyTopicGroupSchema = z.object({
  id: z.string().default(() =>
    crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36)
  ),
  name: z.string().min(1, "Topic group name is required"),
  color: z.string().optional(),
  order: z.number().int().min(0).default(0),
  meetingId: z.string().min(1, "Meeting ID is required"),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
}).strict();

export function migrateLegacyTopicGroup(
  topicGroup: unknown,
): TopicGroupSchemaType {
  return LegacyTopicGroupSchema.parse(topicGroup);
}
