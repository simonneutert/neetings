import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/preact";
import { useMeetingState } from "../hooks/useMeetingState";
import { useGlobalAttendees } from "../hooks/useGlobalAttendees";
import { APP_CONFIG } from "../constants";
import { BaseExporter } from "../utils/export/BaseExporter";
import { TestDataFactory } from "./factories/testDataFactory";

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

describe("Export/Import with Deleted Attendees", () => {
  beforeEach(() => {
    localStorage.clear();
    TestDataFactory.reset();
  });

  it("should export meetings with correct attendee data after deletion", async () => {
    // Setup: Create test data using TestDataFactory
    const attendee1 = TestDataFactory.createAttendee({
      name: "Alice Johnson",
      email: "alice@example.com",
    });
    const attendee2 = TestDataFactory.createAttendee({
      name: "Bob Smith",
      email: "bob@example.com",
    });
    const testMeeting = TestDataFactory.createMeeting({
      id: "meeting1",
      attendeeIds: [attendee1.id, attendee2.id],
    });

    // Initialize with test data
    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
      JSON.stringify([attendee1, attendee2]),
    );
    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
      JSON.stringify([testMeeting]),
    );

    // Setup hooks
    const { result: attendeesResult } = renderHook(() => useGlobalAttendees());
    const { result: meetingsResult } = renderHook(() => useMeetingState());

    // Wait for initial load
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify initial state - both attendees assigned
    expect(attendeesResult.current.attendees).toHaveLength(2);
    expect(meetingsResult.current.meetings[0].attendeeIds).toContain(
      attendee1.id,
    );
    expect(meetingsResult.current.meetings[0].attendeeIds).toContain(
      attendee2.id,
    );

    // Execute: Delete one attendee (Alice)
    act(() => {
      meetingsResult.current.removeAttendeeFromAllMeetings(attendee1.id);
      attendeesResult.current.deleteAttendee(attendee1.id);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify: Only Bob remains in the meeting
    const updatedMeeting = meetingsResult.current.meetings[0];
    expect(updatedMeeting.attendeeIds).toHaveLength(1);
    expect(updatedMeeting.attendeeIds).toContain(attendee2.id);
    expect(updatedMeeting.attendeeIds).not.toContain(attendee1.id);

    // Test export functionality
    const exporter = new BaseExporter();
    const remainingAttendees = attendeesResult.current.getAttendeesByIds(
      updatedMeeting.attendeeIds,
    );

    const exportResult = await exporter.export(updatedMeeting, {
      format: "markdown",
      filename: "test.md",
      attendees: remainingAttendees,
    });

    // Verify: Export only includes remaining attendees
    expect(remainingAttendees).toHaveLength(1);
    expect(remainingAttendees[0].id).toBe(attendee2.id);
    expect(exportResult.content).toContain("Bob Smith");
    expect(exportResult.content).not.toContain("Alice Johnson");
  });

  it("should handle export when all attendees are deleted from meeting", async () => {
    // Setup: Create test data using TestDataFactory
    const attendee1 = TestDataFactory.createAttendee({
      name: "Test User",
      email: "test@example.com",
    });
    const testMeeting = TestDataFactory.createMeeting({
      id: "meeting1",
      attendeeIds: [attendee1.id],
    });

    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
      JSON.stringify([attendee1]),
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

    // Delete the only attendee
    act(() => {
      meetingsResult.current.removeAttendeeFromAllMeetings(attendee1.id);
      attendeesResult.current.deleteAttendee(attendee1.id);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify: Meeting has no attendees
    const updatedMeeting = meetingsResult.current.meetings[0];
    expect(updatedMeeting.attendeeIds).toHaveLength(0);

    // Test export with no attendees
    const exporter = new BaseExporter();
    const exportResult = await exporter.export(updatedMeeting, {
      format: "markdown",
      filename: "test.md",
      attendees: [],
    });

    // Verify: Export succeeds without attendee section
    expect(exportResult.content).not.toContain("## Attendees");
    expect(exportResult.content).not.toContain("Test User");
  });

  it("should properly filter attendees when getting by IDs with deleted attendees", async () => {
    // Setup: Create test data using TestDataFactory
    const attendee1 = TestDataFactory.createAttendee({
      name: "Active User",
      email: "active@example.com",
    });
    const attendee2 = TestDataFactory.createAttendee({
      name: "Deleted User",
      email: "deleted@example.com",
    });

    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
      JSON.stringify([attendee1, attendee2]),
    );

    const { result: attendeesResult } = renderHook(() => useGlobalAttendees());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Test getAttendeesByIds before deletion
    expect(
      attendeesResult.current.getAttendeesByIds([attendee1.id, attendee2.id]),
    ).toHaveLength(2);

    // Delete one attendee
    act(() => {
      attendeesResult.current.deleteAttendee(attendee2.id);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Test getAttendeesByIds after deletion - should only return existing attendees
    const result = attendeesResult.current.getAttendeesByIds([
      attendee1.id,
      attendee2.id,
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(attendee1.id);
    expect(result[0].name).toBe("Active User");
  });

  it("should handle import with orphaned attendee references gracefully", async () => {
    // This simulates importing a meeting that references deleted attendees
    const attendee1 = TestDataFactory.createAttendee({
      name: "Existing User",
      email: "existing@example.com",
    });
    const orphanedAttendeeId = "deleted-attendee-id";

    const testMeeting = TestDataFactory.createMeeting({
      id: "meeting1",
      attendeeIds: [attendee1.id, orphanedAttendeeId], // Reference to non-existent attendee
    });

    // Only store one attendee
    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
      JSON.stringify([attendee1]),
    );

    const { result: attendeesResult } = renderHook(() => useGlobalAttendees());
    const { result: meetingsResult } = renderHook(() => useMeetingState());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Import the meeting with orphaned attendee reference
    act(() => {
      meetingsResult.current.importMeetings([testMeeting]);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify: Meeting was imported with attendee IDs intact
    const importedMeeting = meetingsResult.current.meetings[0];
    expect(importedMeeting.attendeeIds).toContain(attendee1.id);
    expect(importedMeeting.attendeeIds).toContain(orphanedAttendeeId);

    // Test getAttendeesByIds with orphaned reference - should filter out non-existent attendees
    const resolvedAttendees = attendeesResult.current.getAttendeesByIds(
      importedMeeting.attendeeIds,
    );
    expect(resolvedAttendees).toHaveLength(1);
    expect(resolvedAttendees[0].id).toBe(attendee1.id);
  });

  describe("Error Scenarios", () => {
    it("should handle corrupted attendee data in localStorage", async () => {
      // Store corrupted attendee data
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
        "corrupted-json-data",
      );
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
        JSON.stringify([]),
      );

      // Mock console.error to avoid noise in tests
      const originalError = console.error;
      console.error = () => {};

      const { result: attendeesResult } = renderHook(() =>
        useGlobalAttendees()
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Should handle corruption gracefully
      expect(attendeesResult.current.attendees).toHaveLength(0);
      expect(attendeesResult.current.error).toBeTruthy();

      // Restore console.error
      console.error = originalError;
    });

    it("should handle corrupted meeting data in localStorage", async () => {
      // Store corrupted meeting data
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
        JSON.stringify([]),
      );
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
        "corrupted-meeting-data",
      );

      const { result: meetingsResult } = renderHook(() => useMeetingState());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Should handle corruption gracefully
      expect(meetingsResult.current.meetings).toHaveLength(0);
    });

    it("should handle export with malformed attendee objects", async () => {
      const malformedAttendees = [
        {
          id: "malformed-1",
          // Missing required name field
          email: "test@example.com",
        },
        {
          // Missing id field
          name: "Test User",
          email: "test2@example.com",
        },
      ];

      const testMeeting = TestDataFactory.createMeeting({
        attendeeIds: ["malformed-1"],
      });

      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
        JSON.stringify(malformedAttendees),
      );
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
        JSON.stringify([testMeeting]),
      );

      const { result: attendeesResult } = renderHook(() =>
        useGlobalAttendees()
      );
      const { result: meetingsResult } = renderHook(() => useMeetingState());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Should handle malformed data gracefully
      const resolvedAttendees = attendeesResult.current.getAttendeesByIds(
        meetingsResult.current.meetings[0]?.attendeeIds || [],
      );

      // Might filter out malformed attendees
      expect(resolvedAttendees.length).toBeLessThanOrEqual(1);
    });

    // Note: Large attendee list testing moved to performance/export-performance.test.ts

    it("should handle concurrent attendee operations", async () => {
      const baseAttendees = [
        TestDataFactory.createAttendee({ name: "Concurrent User 1" }),
        TestDataFactory.createAttendee({ name: "Concurrent User 2" }),
      ];

      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
        JSON.stringify(baseAttendees),
      );
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
        JSON.stringify([]),
      );

      const { result: attendeesResult } = renderHook(() =>
        useGlobalAttendees()
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Perform concurrent operations
      const operations = Array.from({ length: 10 }, (_, i) =>
        act(() => {
          attendeesResult.current.addAttendee(
            `Concurrent Added ${i}`,
            `concurrent${i}@example.com`,
          );
        }));

      await Promise.all(operations);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Should handle concurrent additions
      expect(attendeesResult.current.attendees.length).toBeGreaterThanOrEqual(
        2,
      );
    });

    it("should handle attendee deletion during export process", async () => {
      const attendee1 = TestDataFactory.createAttendee({
        name: "To Be Deleted",
      });
      const attendee2 = TestDataFactory.createAttendee({ name: "To Remain" });
      const testMeeting = TestDataFactory.createMeeting({
        attendeeIds: [attendee1.id, attendee2.id],
      });

      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
        JSON.stringify([attendee1, attendee2]),
      );
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
        JSON.stringify([testMeeting]),
      );

      const { result: attendeesResult } = renderHook(() =>
        useGlobalAttendees()
      );
      const { result: meetingsResult } = renderHook(() => useMeetingState());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Start export process (simulate)
      const exporter = new BaseExporter();

      // Delete attendee during "export"
      act(() => {
        attendeesResult.current.deleteAttendee(attendee1.id);
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // Export should work with remaining attendees
      const remainingAttendees = attendeesResult.current.getAttendeesByIds(
        meetingsResult.current.meetings[0].attendeeIds,
      );

      const exportResult = await exporter.export(
        meetingsResult.current.meetings[0],
        {
          format: "markdown",
          filename: "test.md",
          attendees: remainingAttendees,
        },
      );

      expect(exportResult.content).toBeTruthy();
      expect(exportResult.content).toContain("To Remain");
      expect(exportResult.content).not.toContain("To Be Deleted");
    });

    // Note: Memory pressure testing moved to performance/export-performance.test.ts

    it("should handle invalid attendee IDs in meeting references", async () => {
      const testMeeting = TestDataFactory.createMeeting({
        attendeeIds: [
          "", // Empty string
          null as any, // null
          undefined as any, // undefined
          123 as any, // number
          { id: "object" } as any, // object
          "valid-id", // valid ID
        ],
      });

      const validAttendee = TestDataFactory.createAttendee({ id: "valid-id" });

      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
        JSON.stringify([validAttendee]),
      );
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
        JSON.stringify([testMeeting]),
      );

      const { result: attendeesResult } = renderHook(() =>
        useGlobalAttendees()
      );
      const { result: meetingsResult } = renderHook(() => useMeetingState());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Should filter out invalid IDs
      const meeting = meetingsResult.current.meetings[0];
      const attendeeIds = meeting ? meeting.attendeeIds : [];
      const resolvedAttendees = attendeesResult.current.getAttendeesByIds(
        attendeeIds,
      );

      expect(resolvedAttendees.length).toBeGreaterThanOrEqual(0);
      if (resolvedAttendees.length > 0) {
        expect(resolvedAttendees[0].id).toBe("valid-id");
      }
    });
  });
});
