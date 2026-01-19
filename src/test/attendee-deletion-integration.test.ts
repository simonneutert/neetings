import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/preact";
import { useMeetingState } from "../hooks/useMeetingState";
import { useGlobalAttendees } from "../hooks/useGlobalAttendees";
import { createEmptyMeeting } from "../types/Meeting";
import { createAttendee } from "../types/Attendee";
import { APP_CONFIG } from "../constants";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("Attendee Deletion Integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should remove attendee from all meetings when deleted", async () => {
    // Setup: Create test data
    const testAttendee = createAttendee("Test User", "test@example.com");
    const testMeeting1 = createEmptyMeeting("meeting1");
    const testMeeting2 = createEmptyMeeting("meeting2");

    // Add attendee to both meetings
    testMeeting1.attendeeIds = [testAttendee.id];
    testMeeting2.attendeeIds = [testAttendee.id];

    // Initialize with test data
    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
      JSON.stringify([testAttendee]),
    );
    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
      JSON.stringify([testMeeting1, testMeeting2]),
    );

    // Setup hooks
    const { result: attendeesResult } = renderHook(() => useGlobalAttendees());
    const { result: meetingsResult } = renderHook(() => useMeetingState());

    // Wait for initial load
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify initial state
    expect(attendeesResult.current.attendees).toHaveLength(1);
    expect(meetingsResult.current.meetings).toHaveLength(2);
    expect(meetingsResult.current.countMeetingsWithAttendee(testAttendee.id))
      .toBe(2);

    // Execute: Delete attendee
    act(() => {
      meetingsResult.current.removeAttendeeFromAllMeetings(testAttendee.id);
      attendeesResult.current.deleteAttendee(testAttendee.id);
    });

    // Wait for state updates
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify: Attendee removed from global list
    expect(attendeesResult.current.attendees).toHaveLength(0);

    // Verify: Attendee removed from all meetings
    expect(meetingsResult.current.countMeetingsWithAttendee(testAttendee.id))
      .toBe(0);

    const updatedMeetings = meetingsResult.current.meetings;
    expect(updatedMeetings[0].attendeeIds).not.toContain(testAttendee.id);
    expect(updatedMeetings[1].attendeeIds).not.toContain(testAttendee.id);
  });

  it("should correctly count meetings with attendee", async () => {
    // Setup: Create test data
    const attendee1 = createAttendee("User 1", "user1@example.com");
    const attendee2 = createAttendee("User 2", "user2@example.com");

    const meeting1 = createEmptyMeeting("meeting1");
    const meeting2 = createEmptyMeeting("meeting2");
    const meeting3 = createEmptyMeeting("meeting3");

    // Attendee1 is in meetings 1 and 2, attendee2 is only in meeting 3
    meeting1.attendeeIds = [attendee1.id];
    meeting2.attendeeIds = [attendee1.id, attendee2.id];
    meeting3.attendeeIds = [attendee2.id];

    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
      JSON.stringify([meeting1, meeting2, meeting3]),
    );

    const { result } = renderHook(() => useMeetingState());

    // Wait for initial load
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify counts
    expect(result.current.countMeetingsWithAttendee(attendee1.id)).toBe(2);
    expect(result.current.countMeetingsWithAttendee(attendee2.id)).toBe(2);
    expect(result.current.countMeetingsWithAttendee("non-existent-id")).toBe(0);
  });

  it("should handle deletion of attendee not in any meetings", async () => {
    // Setup: Create attendee not assigned to any meetings
    const testAttendee = createAttendee(
      "Unassigned User",
      "unassigned@example.com",
    );
    const testMeeting = createEmptyMeeting("meeting1");

    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
      JSON.stringify([testAttendee]),
    );
    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
      JSON.stringify([testMeeting]),
    );

    const { result: attendeesResult } = renderHook(() => useGlobalAttendees());
    const { result: meetingsResult } = renderHook(() => useMeetingState());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify initial state
    expect(meetingsResult.current.countMeetingsWithAttendee(testAttendee.id))
      .toBe(0);

    // Execute: Delete attendee
    act(() => {
      meetingsResult.current.removeAttendeeFromAllMeetings(testAttendee.id);
      attendeesResult.current.deleteAttendee(testAttendee.id);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify: Attendee removed successfully
    expect(attendeesResult.current.attendees).toHaveLength(0);
    expect(meetingsResult.current.meetings).toHaveLength(1);
    expect(meetingsResult.current.meetings[0].attendeeIds).toHaveLength(0);
  });
});
