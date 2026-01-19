import { Meeting } from "../../../types/Meeting";
import { Attendee } from "../../../types/Attendee";

/**
 * Shared attendee handling utilities for export transformers
 * Eliminates duplication across all transformer files
 */
export class AttendeeUtils {
  /**
   * Filter attendees to only include those assigned to a specific meeting
   */
  static filterMeetingAttendees(
    attendees: Attendee[],
    meeting: Meeting,
  ): Attendee[] {
    if (
      !attendees || attendees.length === 0 || !meeting.attendeeIds ||
      meeting.attendeeIds.length === 0
    ) {
      return [];
    }

    return attendees.filter((a) => meeting.attendeeIds.includes(a.id));
  }

  /**
   * Generate attendees label with proper count interpolation
   */
  static getAttendeesLabelWithCount(
    count: number,
    t?: (key: string) => string,
  ): string {
    if (t) {
      const template = t("importExport.content.attendeesWithCount");
      return template.replace("{{count}}", count.toString());
    }
    return `Attendees (${count})`;
  }

  /**
   * Format attendee name with optional email
   */
  static formatAttendeeName(attendee: Attendee): string {
    return attendee.email
      ? `${attendee.name} (${attendee.email})`
      : attendee.name;
  }

  /**
   * Check if meeting has attendees
   */
  static hasAttendees(attendees: Attendee[], meeting: Meeting): boolean {
    const meetingAttendees = this.filterMeetingAttendees(attendees, meeting);
    return meetingAttendees.length > 0;
  }

  /**
   * Get attendee data for a meeting or return null if none
   */
  static getMeetingAttendeesOrNull(
    attendees: Attendee[],
    meeting: Meeting,
  ): Attendee[] | null {
    const meetingAttendees = this.filterMeetingAttendees(attendees, meeting);
    return meetingAttendees.length > 0 ? meetingAttendees : null;
  }
}
