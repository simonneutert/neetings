import {
  createImportResult,
  createValidationError,
  DataCorruptionError,
  FileProcessingError,
  ImportResult,
  PartialImportData,
  ValidationErrorDetail,
} from "./ExportErrors";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const SUPPORTED_MIME_TYPES = ["application/json", "text/json"];

export function validateFileBeforeProcessing(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new FileProcessingError(
      `File size ${file.size} exceeds maximum ${MAX_FILE_SIZE}`,
      file.type,
      file.name,
      file.size,
    );
  }

  if (
    !SUPPORTED_MIME_TYPES.includes(file.type) &&
    !file.name.endsWith(".json")
  ) {
    throw new FileProcessingError(
      `Unsupported file type: ${file.type}`,
      file.type,
      file.name,
      file.size,
    );
  }
}

export async function safeJsonParse(content: string): Promise<any> {
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new DataCorruptionError(
      `JSON parsing failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
      ["json_structure"],
      null,
    );
  }
}

function isValidMeeting(meeting: any): boolean {
  return !!(
    meeting &&
    typeof meeting.id === "string" &&
    typeof meeting.title === "string" &&
    typeof meeting.date === "string" &&
    Array.isArray(meeting.blocks) &&
    Array.isArray(meeting.attendeeIds)
  );
}

function isValidAttendee(attendee: any): boolean {
  return !!(
    attendee &&
    typeof attendee.id === "string" &&
    typeof attendee.name === "string" &&
    attendee.name.trim().length > 0
  );
}

export async function attemptPartialImport(
  data: any,
  validationErrors: ValidationErrorDetail[],
): Promise<PartialImportData> {
  const validMeetings: any[] = [];
  const validAttendees: any[] = [];
  const invalidMeetings: any[] = [];
  const invalidAttendees: any[] = [];
  const errors: ValidationErrorDetail[] = [...validationErrors];

  if (Array.isArray(data.meetings)) {
    data.meetings.forEach((meeting: any, index: number) => {
      if (isValidMeeting(meeting)) {
        validMeetings.push(meeting);
      } else {
        invalidMeetings.push(meeting);
        errors.push(createValidationError(
          `meetings[${index}]`,
          "Meeting validation failed",
          "INVALID_MEETING_DATA",
        ));
      }
    });
  }

  if (Array.isArray(data.attendees)) {
    data.attendees.forEach((attendee: any, index: number) => {
      if (isValidAttendee(attendee)) {
        validAttendees.push(attendee);
      } else {
        invalidAttendees.push(attendee);
        errors.push(createValidationError(
          `attendees[${index}]`,
          "Attendee validation failed",
          "INVALID_ATTENDEE_DATA",
        ));
      }
    });
  }

  const recoveredCount = validMeetings.length + validAttendees.length;
  const totalCount = (data.meetings?.length || 0) +
    (data.attendees?.length || 0);

  return {
    validMeetings,
    validAttendees,
    invalidMeetings,
    invalidAttendees,
    recoveredCount,
    totalCount,
    errors,
  };
}

export function handleImportError(
  error: unknown,
  _context?: Record<string, any>,
): ImportResult {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("Import error:", error);

  return createImportResult(false, {
    errors: [createValidationError(
      "unknown",
      errorMessage,
      "UNKNOWN_ERROR",
    )],
    summary: "Import failed. Please check the file and try again.",
  });
}
