export interface Attendee {
  id: string; // UUID for unique identification
  name: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

// Utility function to create a new attendee
export function createAttendee(name: string = "", email?: string): Attendee {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
    name,
    email,
    created_at: now,
    updated_at: now,
  };
}

// Utility function to update attendee timestamp
export function updateAttendeeTimestamp(attendee: Attendee): Attendee {
  return {
    ...attendee,
    updated_at: new Date().toISOString(),
  };
}

// Validation function for attendee data
export function validateAttendee(attendee: Attendee): boolean {
  return !!(
    attendee.id &&
    attendee.name &&
    attendee.created_at &&
    attendee.updated_at
  );
}
