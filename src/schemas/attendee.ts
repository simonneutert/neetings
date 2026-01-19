import { z } from "zod";

// Attendee schema
export const AttendeeSchema = z.object({
  id: z.string().min(1, "Attendee ID is required"),
  name: z.string().min(1, "Attendee name is required"),
  email: z.string().email("Invalid email format").or(z.literal("")).optional(),
  created_at: z.string().datetime("Invalid datetime format for created_at"),
  updated_at: z.string().datetime("Invalid datetime format for updated_at"),
}).strict();

// Infer TypeScript type from schema
export type AttendeeSchemaType = z.infer<typeof AttendeeSchema>;

// Schema for creating new attendees (without generated fields)
export const CreateAttendeeSchema = AttendeeSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  // Optional overrides for creation
  id: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Schema for updating attendees (all fields optional except id)
export const UpdateAttendeeSchema = AttendeeSchema.partial().extend({
  id: z.string().min(1, "Attendee ID is required for updates"),
});

// Array of attendees schema
export const AttendeeArraySchema = z.array(AttendeeSchema);

// Validation utilities
export function validateAttendee(
  attendee: unknown,
): attendee is AttendeeSchemaType {
  return AttendeeSchema.safeParse(attendee).success;
}

export function parseAttendee(attendee: unknown): AttendeeSchemaType {
  return AttendeeSchema.parse(attendee);
}

export function parseAttendeeSafe(
  attendee: unknown,
): { success: true; data: AttendeeSchemaType } | {
  success: false;
  error: z.ZodError;
} {
  const result = AttendeeSchema.safeParse(attendee);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
}

// Migration helper for attendees without required fields
export const LegacyAttendeeSchema = z.object({
  id: z.string().default(() =>
    crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36)
  ),
  name: z.string().min(1, "Attendee name is required"),
  email: z.string().email("Invalid email format"),
  created_at: z.string().datetime().default(() => new Date().toISOString()),
  updated_at: z.string().datetime().default(() => new Date().toISOString()),
}).strict();

export function migrateLegacyAttendee(attendee: unknown): AttendeeSchemaType {
  return LegacyAttendeeSchema.parse(attendee);
}
