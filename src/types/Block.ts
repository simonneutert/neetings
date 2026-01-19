import { SemanticColor } from "../utils/colors";
import { generateSortKey, isValidSortKey } from "../utils/sortKeys";

// Clean Block interface - sortKey required, no legacy position field
export interface Block {
  id: string; // Required - every block must have an ID
  type:
    | "textblock"
    | "qandablock"
    | "researchblock"
    | "factblock"
    | "decisionblock"
    | "issueblock"
    | "todoblock"
    | "goalblock"
    | "followupblock"
    | "ideablock"
    | "referenceblock";
  text?: string;
  question?: string;
  answer?: string;
  topic?: string;
  result?: string;
  fact?: string;
  decision?: string;
  issue?: string;
  todo?: string;
  goal?: string;
  followup?: string;
  idea?: string;
  reference?: string;
  content?: Record<string, string>;
  created_at: string; // Required - creation timestamp
  completed?: boolean;
  topicGroupId: string | null; // Standardized: null for default, string for topic groups
  sortKey: string; // Required - lexicographic ordering key
}

export const BLOCK_TYPES = {
  // Documentation Group - Blue Shades
  textblock: {
    label: "Note",
    color: "doc-dark" as SemanticColor,
    fields: ["text"],
  },
  qandablock: {
    label: "Q&A",
    color: "doc-medium" as SemanticColor,
    fields: ["question", "answer"],
  },
  referenceblock: {
    label: "Reference",
    color: "doc-light" as SemanticColor,
    fields: ["reference"],
  },

  // Ideation Group - Yellow Shades
  factblock: {
    label: "Fact",
    color: "idea-medium" as SemanticColor,
    fields: ["fact"],
  },
  ideablock: {
    label: "Idea",
    color: "idea-dark" as SemanticColor,
    fields: ["idea"],
  },
  researchblock: {
    label: "Research",
    color: "idea-light" as SemanticColor,
    fields: ["topic", "result"],
  },

  // Action Group - Orange Shades
  todoblock: {
    label: "TODO",
    color: "action-dark" as SemanticColor,
    fields: ["todo"],
  },
  followupblock: {
    label: "Follow-up",
    color: "action-light" as SemanticColor,
    fields: ["followup"],
  },
  goalblock: {
    label: "Goal",
    color: "action-medium" as SemanticColor,
    fields: ["goal"],
  },

  // Decision Group - Critical Colors
  decisionblock: {
    label: "Decision",
    color: "decision-success" as SemanticColor,
    fields: ["decision"],
  },
  issueblock: {
    label: "Issue",
    color: "decision-danger" as SemanticColor,
    fields: ["issue"],
  },
} as const;

// Clean block creation - always generates sortKey, standardizes topicGroupId
export function createBlock(
  type: Block["type"],
  topicGroupId: string | null = null,
  sortKey?: string,
): Block {
  const fields = BLOCK_TYPES[type].fields;
  const block: Block = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
    type,
    created_at: new Date().toISOString(),
    sortKey: sortKey || generateSortKey(),
    topicGroupId, // Always null or string, never undefined
  };

  // Initialize fields with empty strings
  fields.forEach((field) => {
    (block as any)[field] = "";
  });

  return block;
}

// Helper to get field value from block
export function getBlockFieldValue(block: Block, field: string): string {
  if (block.content && field in block.content) {
    return block.content[field] || "";
  }
  return (block as any)[field] || "";
}

// Helper to update field value in block
export function setBlockFieldValue(
  block: Block,
  field: string,
  value: string,
): Block {
  return {
    ...block,
    [field]: value,
  };
}

// Helper to toggle TODO completion status
export function toggleBlockCompletion(block: Block): Block {
  if (block.type !== "todoblock") {
    return block;
  }
  return {
    ...block,
    completed: !block.completed,
  };
}

// Validate that a block has all required fields
export function validateBlock(block: Block): boolean {
  return !!(
    block.id &&
    block.type &&
    block.created_at &&
    block.sortKey &&
    isValidSortKey(block.sortKey) &&
    (block.topicGroupId === null || typeof block.topicGroupId === "string")
  );
}

// Normalize topicGroupId to always be null or string (never undefined)
export function normalizeTopicGroupId(
  topicGroupId: string | null | undefined,
): string | null {
  return topicGroupId || null;
}
