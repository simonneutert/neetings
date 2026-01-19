import { z } from "zod";

// Block type enum schema
export const BlockTypeSchema = z.enum([
  "textblock",
  "qandablock",
  "researchblock",
  "factblock",
  "decisionblock",
  "issueblock",
  "todoblock",
  "goalblock",
  "followupblock",
  "ideablock",
  "referenceblock",
]);

// Base Block schema with all possible fields
export const BlockSchema = z.object({
  // Required core fields
  id: z.string().min(1, "Block ID is required"),
  type: BlockTypeSchema,
  created_at: z.string().datetime("Invalid datetime format for created_at"),
  sortKey: z.string().min(1, "Sort key is required"),
  topicGroupId: z.string().nullable(),

  // Optional type-specific content fields
  text: z.string().optional(),
  question: z.string().optional(),
  answer: z.string().optional(),
  topic: z.string().optional(),
  result: z.string().optional(),
  fact: z.string().optional(),
  decision: z.string().optional(),
  issue: z.string().optional(),
  todo: z.string().optional(),
  goal: z.string().optional(),
  followup: z.string().optional(),
  idea: z.string().optional(),
  reference: z.string().optional(),

  // Additional optional fields
  completed: z.boolean().optional(),
  content: z.record(z.string(), z.string()).optional(), // Legacy field
}).strict();

// Infer TypeScript type from schema
export type BlockSchemaType = z.infer<typeof BlockSchema>;

// Schema for creating new blocks (without generated fields)
export const CreateBlockSchema = BlockSchema.omit({
  id: true,
  created_at: true,
  sortKey: true,
}).extend({
  // Optional overrides for creation
  id: z.string().optional(),
  created_at: z.string().datetime().optional(),
  sortKey: z.string().optional(),
});

// Schema for updating blocks (all fields optional except id)
export const UpdateBlockSchema = BlockSchema.partial().extend({
  id: z.string().min(1, "Block ID is required for updates"),
});

// Block type-specific validation schemas
export const TextBlockSchema = BlockSchema.extend({
  type: z.literal("textblock"),
  text: z.string().min(1, "Text content is required for text blocks"),
});

export const TodoBlockSchema = BlockSchema.extend({
  type: z.literal("todoblock"),
  todo: z.string().min(1, "Todo content is required for todo blocks"),
  completed: z.boolean().default(false),
});

export const QandABlockSchema = BlockSchema.extend({
  type: z.literal("qandablock"),
  question: z.string().min(1, "Question is required for Q&A blocks"),
  answer: z.string().optional(),
});

export const ResearchBlockSchema = BlockSchema.extend({
  type: z.literal("researchblock"),
  topic: z.string().min(1, "Topic is required for research blocks"),
  result: z.string().optional(),
});

// Union type for type-specific validation
export const TypedBlockSchema = z.discriminatedUnion("type", [
  TextBlockSchema,
  TodoBlockSchema,
  QandABlockSchema,
  ResearchBlockSchema,
  // Generic schema for other types
  BlockSchema.extend({
    type: z.enum([
      "factblock",
      "decisionblock",
      "issueblock",
      "goalblock",
      "followupblock",
      "ideablock",
      "referenceblock",
    ]),
  }),
]);

// Array of blocks schema
export const BlockArraySchema = z.array(BlockSchema);

// Validation utilities
export function validateBlock(block: unknown): block is BlockSchemaType {
  return BlockSchema.safeParse(block).success;
}

export function parseBlock(block: unknown): BlockSchemaType {
  return BlockSchema.parse(block);
}

export function parseBlockSafe(
  block: unknown,
): { success: true; data: BlockSchemaType } | {
  success: false;
  error: z.ZodError;
} {
  const result = BlockSchema.safeParse(block);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
}

// Migration helper for blocks without required fields
export const LegacyBlockSchema = z.object({
  id: z.string().default(() =>
    crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36)
  ),
  type: BlockTypeSchema,
  created_at: z.string().datetime().default(() => new Date().toISOString()),
  sortKey: z.string().default(() =>
    Date.now().toString(36) + Math.random().toString(36).substr(2)
  ),
  topicGroupId: z.string().nullable().default(null),

  // All content fields optional for legacy support
  text: z.string().optional(),
  question: z.string().optional(),
  answer: z.string().optional(),
  topic: z.string().optional(),
  result: z.string().optional(),
  fact: z.string().optional(),
  decision: z.string().optional(),
  issue: z.string().optional(),
  todo: z.string().optional(),
  goal: z.string().optional(),
  followup: z.string().optional(),
  idea: z.string().optional(),
  reference: z.string().optional(),
  completed: z.boolean().optional(),
  content: z.record(z.string(), z.string()).optional(),
}).strict();

export function migrateLegacyBlock(block: unknown): BlockSchemaType {
  return LegacyBlockSchema.parse(block);
}
