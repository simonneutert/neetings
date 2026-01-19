import { Block } from "./Block";
import { TopicGroup } from "./TopicGroup";
import { APP_CONFIG } from "../constants/index";

export interface Meeting {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  blocks: Block[];
  topicGroups?: TopicGroup[]; // Optional for backward compatibility
  attendeeIds: string[]; // References to global attendees
  created_at: string;
  updated_at: string;
}

export interface MeetingFilters {
  dateFrom: string;
  dateTo: string;
  selectedFilters: string[];
}

export type MeetingUpdateData = Partial<Omit<Meeting, "id" | "created_at">>;

// Utility functions for meetings
export function createEmptyMeeting(id: string, title?: string): Meeting {
  const now = new Date().toISOString();
  return {
    id,
    title: title || APP_CONFIG.DEFAULT_VALUES.MEETING_TITLE,
    date: new Date().toISOString().slice(0, 10),
    startTime: "",
    endTime: "",
    blocks: [],
    topicGroups: [], // Start with empty topic groups - user can add as needed
    attendeeIds: [], // Start with empty attendee references
    created_at: now,
    updated_at: now,
  };
}

export function updateMeetingTimestamp(meeting: Meeting): Meeting {
  return {
    ...meeting,
    updated_at: new Date().toISOString(),
  };
}
