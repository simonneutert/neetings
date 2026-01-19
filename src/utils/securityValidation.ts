import { z } from "zod";

// Enhanced validation schemas for security
export const SecureSortKeySchema = z.string()
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid sortKey format")
  .max(100, "SortKey too long");

export const SecureUUIDSchema = z.string()
  .uuid("Invalid UUID format");

export const SecureTextContentSchema = z.string()
  .max(10000, "Content too long")
  .refine(
    (val) =>
      !/<script|javascript:|data:|vbscript:|onload|onerror|onclick/i.test(val),
    "Potentially malicious content detected",
  );

export const SecureEmailSchema = z.string()
  .email("Invalid email format")
  .max(254, "Email too long") // RFC 5321 limit
  .refine(
    (val) => !/<script|javascript:/i.test(val),
    "Invalid email content",
  );

// JSON depth limiting to prevent stack overflow attacks
export function validateJSONDepth(obj: any, maxDepth = 10): boolean {
  function checkDepth(item: any, depth: number): boolean {
    if (depth > maxDepth) return false;
    if (typeof item === "object" && item !== null) {
      if (Array.isArray(item)) {
        return item.every((element) => checkDepth(element, depth + 1));
      }
      return Object.values(item).every((value) => checkDepth(value, depth + 1));
    }
    return true;
  }
  return checkDepth(obj, 0);
}

// Validate file size and type for uploads
export function validateFileUpload(
  file: File,
): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = ["application/json", "text/plain"];

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File too large. Maximum size is 50MB." };
  }

  if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith(".json")) {
    return {
      valid: false,
      error: "Invalid file type. Please select a JSON file.",
    };
  }

  return { valid: true };
}

// Sanitize user input for display
export function sanitizeUserInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// Validate meeting data structure
export const SecureMeetingDataSchema = z.object({
  id: SecureUUIDSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  date: z.string().datetime(),
  attendeeIds: z.array(SecureUUIDSchema).max(100),
  blocks: z.array(z.object({
    id: SecureUUIDSchema,
    type: z.enum([
      "note",
      "qa",
      "research",
      "fact",
      "decision",
      "issue",
      "todo",
      "goal",
      "followup",
      "idea",
      "reference",
    ]),
    title: z.string().min(1).max(200),
    content: SecureTextContentSchema,
    sortKey: SecureSortKeySchema,
    topicGroupId: SecureUUIDSchema.optional(),
    completed: z.boolean().optional(),
    assigneeId: SecureUUIDSchema.optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    dueDate: z.string().datetime().optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    metadata: z.record(z.string().max(500)).optional(),
  })).max(1000),
  topicGroups: z.array(z.object({
    id: SecureUUIDSchema,
    title: z.string().min(1).max(100),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
    sortKey: SecureSortKeySchema,
  })).max(50),
});

// Validate attendee data
export const SecureAttendeeSchema = z.object({
  id: SecureUUIDSchema,
  name: z.string().min(1).max(100),
  email: SecureEmailSchema.optional(),
  role: z.string().max(50).optional(),
  meetingIds: z.array(SecureUUIDSchema).max(100),
});

// Memory usage checker
export function checkMemoryUsage(
  data: any,
): { size: number; warning: boolean } {
  const jsonString = JSON.stringify(data);
  const sizeInBytes = new Blob([jsonString]).size;
  const sizeInMB = sizeInBytes / (1024 * 1024);

  return {
    size: sizeInBytes,
    warning: sizeInMB > 5, // Warn if over 5MB
  };
}

// Validate export data before processing
export function validateExportData(
  data: any,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check JSON depth
  if (!validateJSONDepth(data, 10)) {
    errors.push("Data structure too deeply nested");
  }

  // Check memory usage
  const memCheck = checkMemoryUsage(data);
  if (memCheck.warning) {
    errors.push(
      `Large data size: ${(memCheck.size / 1024 / 1024).toFixed(2)}MB`,
    );
  }

  // Validate structure exists
  if (!data || typeof data !== "object") {
    errors.push("Invalid data structure");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
