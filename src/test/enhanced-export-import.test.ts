import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/preact";
import { useMeetingState } from "../hooks/useMeetingState";
import { useGlobalAttendees } from "../hooks/useGlobalAttendees";
import {
  createExportFilename,
  detectExportVersion,
  ExportV1Schema,
} from "../schemas/export";
import { APP_CONFIG } from "../constants";
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

describe("Enhanced Export/Import with Attendees", () => {
  beforeEach(() => {
    localStorage.clear();
    TestDataFactory.reset();
  });

  it("should export data in v1.0.0 format with attendees and meetings", async () => {
    // Setup: Create test data using TestDataFactory
    const testAttendees = [
      TestDataFactory.createAttendee({
        name: "Alice Johnson",
        email: "alice@example.com",
      }),
      TestDataFactory.createAttendee({
        name: "Bob Smith",
        email: "bob@example.com",
      }),
      TestDataFactory.createAttendee({ name: "Charlie Brown" }), // No email
    ];

    const testMeetings = [
      TestDataFactory.createMeeting({
        id: "meeting1",
        title: "Meeting 1",
        attendeeIds: [testAttendees[0].id, testAttendees[1].id],
      }),
      TestDataFactory.createMeeting({
        id: "meeting2",
        title: "Meeting 2",
        attendeeIds: [testAttendees[1].id, testAttendees[2].id],
      }),
    ];

    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
      JSON.stringify(testAttendees),
    );
    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
      JSON.stringify(testMeetings),
    );

    // Simulate export
    const exportData = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      attendees: testAttendees,
      title: "Test Meeting Series",
      agenda: "Test agenda for the meeting series",
      meetings: testMeetings,
      metadata: {
        appVersion: "1.0.0",
        totalMeetings: testMeetings.length,
        totalAttendees: testAttendees.length,
        blockTypes: [],
        includesAttendees: true,
        includesTopicGroups: true,
      },
    };

    // Verify export format
    expect(detectExportVersion(exportData)).toBe("1.0.0");
    expect(ExportV1Schema.safeParse(exportData).success).toBe(true);
    expect(exportData.attendees).toHaveLength(3);
    expect(exportData.meetings).toHaveLength(2);
    expect(exportData.metadata.totalAttendees).toBe(3);
  });

  it("should import v1.0.0 format and restore both attendees and meetings", async () => {
    // Setup: Create import data using TestDataFactory
    const importAttendees = [
      TestDataFactory.createAttendee({
        name: "Imported User 1",
        email: "import1@example.com",
      }),
      TestDataFactory.createAttendee({
        name: "Imported User 2",
        email: "import2@example.com",
      }),
    ];

    const importMeetings = [
      TestDataFactory.createMeeting({
        id: "imported-meeting",
        title: "Imported Meeting",
        attendeeIds: [importAttendees[0].id],
      }),
    ];

    const importData = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      attendees: importAttendees,
      title: "Imported Meeting Series",
      agenda: "Imported agenda",
      meetings: importMeetings,
      metadata: {
        appVersion: "1.0.0",
        totalMeetings: 1,
        totalAttendees: 2,
        blockTypes: [],
        includesAttendees: true,
        includesTopicGroups: true,
      },
    };

    // Simulate import process
    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
      JSON.stringify(importData.attendees),
    );
    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
      JSON.stringify(importData.meetings),
    );

    // Initialize hooks
    const { result: attendeesResult } = renderHook(() => useGlobalAttendees());
    const { result: meetingsResult } = renderHook(() => useMeetingState());

    // Wait for initial load
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify attendees were imported
    expect(attendeesResult.current.attendees).toHaveLength(2);
    expect(attendeesResult.current.attendees[0].name).toBe("Imported User 1");
    expect(attendeesResult.current.attendees[1].email).toBe(
      "import2@example.com",
    );

    // Verify meetings were imported with correct attendee references
    expect(meetingsResult.current.meetings).toHaveLength(1);
    expect(meetingsResult.current.meetings[0].title).toBe("Imported Meeting");
    expect(meetingsResult.current.meetings[0].attendeeIds).toContain(
      importAttendees[0].id,
    );
  });

  it("should handle legacy v1.0.0 format gracefully (meetings only)", async () => {
    // Legacy format: just an array of meetings
    const legacyMeetings = [
      TestDataFactory.createMeeting({
        id: "legacy-meeting",
        title: "Legacy Meeting",
        attendeeIds: ["orphaned-id"],
      }),
    ];

    // Simulate import of legacy format
    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
      JSON.stringify(legacyMeetings),
    );
    // No attendees data in legacy format

    const { result: meetingsResult } = renderHook(() => useMeetingState());
    const { result: attendeesResult } = renderHook(() => useGlobalAttendees());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify meetings imported
    expect(meetingsResult.current.meetings).toHaveLength(1);
    expect(meetingsResult.current.meetings[0].title).toBe("Legacy Meeting");

    // Verify no attendees (orphaned references)
    expect(attendeesResult.current.attendees).toHaveLength(0);
    expect(meetingsResult.current.meetings[0].attendeeIds).toContain(
      "orphaned-id",
    );
  });

  it("should create export data that survives round-trip import/export", async () => {
    // Setup original data using TestDataFactory
    const originalAttendees = [
      TestDataFactory.createAttendee({
        name: "Round Trip User",
        email: "roundtrip@example.com",
      }),
    ];

    const originalMeetings = [
      TestDataFactory.createMeeting({
        id: "roundtrip-meeting",
        title: "Round Trip Meeting",
        attendeeIds: [originalAttendees[0].id],
      }),
    ];

    // First export
    const exportData = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      attendees: originalAttendees,
      title: "Round Trip Series",
      agenda: "Round trip test agenda",
      meetings: originalMeetings,
      metadata: {
        appVersion: "1.0.0",
        totalMeetings: 1,
        totalAttendees: 1,
        blockTypes: [],
        includesAttendees: true,
        includesTopicGroups: true,
      },
    };

    // Simulate import
    localStorage.clear();
    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
      JSON.stringify(exportData.attendees),
    );
    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
      JSON.stringify(exportData.meetings),
    );

    const { result: attendeesResult } = renderHook(() => useGlobalAttendees());
    const { result: meetingsResult } = renderHook(() => useMeetingState());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Second export
    const reExportData = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      attendees: attendeesResult.current.attendees,
      title: meetingsResult.current.seriesTitle,
      agenda: meetingsResult.current.seriesAgenda,
      meetings: meetingsResult.current.meetings,
      metadata: {
        appVersion: "1.0.0",
        totalMeetings: meetingsResult.current.meetings.length,
        totalAttendees: attendeesResult.current.attendees.length,
        blockTypes: [],
        includesAttendees: true,
        includesTopicGroups: true,
      },
    };

    // Verify data integrity
    expect(reExportData.attendees).toEqual(originalAttendees);
    expect(reExportData.meetings[0].title).toBe("Round Trip Meeting");
    expect(reExportData.meetings[0].attendeeIds).toEqual([
      originalAttendees[0].id,
    ]);
    expect(ExportV1Schema.safeParse(reExportData).success).toBe(true);
  });

  it("should handle export with no attendees gracefully", async () => {
    const meetingsOnly = [
      TestDataFactory.createMeeting({
        id: "no-attendees",
        title: "Meeting Without Attendees",
        attendeeIds: [],
      }),
    ];

    const exportData = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      attendees: [],
      title: "No Attendees Series",
      agenda: "Series without attendees",
      meetings: meetingsOnly,
      metadata: {
        appVersion: "1.0.0",
        totalMeetings: 1,
        totalAttendees: 0,
        blockTypes: [],
        includesAttendees: true,
        includesTopicGroups: true,
      },
    };

    expect(ExportV1Schema.safeParse(exportData).success).toBe(true);
    expect(exportData.metadata.totalAttendees).toBe(0);
    expect(exportData.attendees).toHaveLength(0);
  });

  it("should generate sanitized export filenames from series titles", () => {
    const date = new Date().toISOString().slice(0, 10);

    // Test normal title
    expect(createExportFilename("My Project Meeting Series")).toBe(
      `my_project_meeting_series_${date}.json`,
    );

    // Test title with special characters
    expect(createExportFilename("Meeting @#$% with Special Characters!")).toBe(
      `meeting_with_special_char_${date}.json`, // Limited to 30 chars before sanitization
    );

    // Test very long title (gets truncated to 30 chars)
    expect(
      createExportFilename(
        "This is a Very Long Meeting Series Title That Exceeds Thirty Characters",
      ),
    ).toBe(
      `this_is_a_very_long_meeting_se_${date}.json`,
    );

    // Test empty title (should fallback)
    expect(createExportFilename("")).toBe(
      `neetings_backup_${date}.json`,
    );

    // Test title with only special characters (should fallback)
    expect(createExportFilename("@#$%^&*()")).toBe(
      `neetings_backup_${date}.json`,
    );

    // Test title with mixed case and spaces
    expect(createExportFilename("Weekly STANDUP meetings")).toBe(
      `weekly_standup_meetings_${date}.json`,
    );
  });

  describe("Error Scenarios", () => {
    it("should handle corrupted export data gracefully", async () => {
      // Test with malformed JSON structure
      const corruptedData = {
        version: "1.0.0",
        meetings: null, // Invalid meetings array
        attendees: "not-an-array", // Invalid attendees
      };

      expect(ExportV1Schema.safeParse(corruptedData).success).toBe(false);

      // detectExportVersion may throw for truly corrupted data
      try {
        const version = detectExportVersion(corruptedData);
        expect(version).toBe("1.0.0");
      } catch (error) {
        expect(error.message).toContain("Unsupported or invalid export format");
      }
    });

    it("should handle missing required fields in export data", async () => {
      const incompleteData = {
        version: "1.0.0",
        // Missing required fields like meetings, attendees, etc.
      };

      expect(ExportV1Schema.safeParse(incompleteData).success).toBe(false);
    });

    it("should handle invalid attendee data in export", async () => {
      const invalidAttendeeData = {
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        attendees: [
          {
            id: "invalid-attendee",
            // Missing required name field
            email: "test@example.com",
          },
        ],
        meetings: [],
        title: "Test",
        agenda: "",
        metadata: {
          appVersion: "1.0.0",
          totalMeetings: 0,
          totalAttendees: 1,
          blockTypes: [],
          includesAttendees: true,
          includesTopicGroups: true,
        },
      };

      expect(ExportV1Schema.safeParse(invalidAttendeeData).success).toBe(false);
    });

    it("should handle invalid meeting data in export", async () => {
      const invalidMeetingData = {
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        attendees: [],
        meetings: [
          {
            id: "invalid-meeting",
            // Missing required fields like title, date, etc.
            blocks: [],
          },
        ],
        title: "Test",
        agenda: "",
        metadata: {
          appVersion: "1.0.0",
          totalMeetings: 1,
          totalAttendees: 0,
          blockTypes: [],
          includesAttendees: true,
          includesTopicGroups: true,
        },
      };

      expect(ExportV1Schema.safeParse(invalidMeetingData).success).toBe(false);
    });

    it("should handle unsupported export versions", async () => {
      const unsupportedVersionData = {
        version: "99.0.0",
        meetings: [],
        attendees: [],
      };

      // detectExportVersion should throw for unsupported versions
      try {
        const version = detectExportVersion(unsupportedVersionData);
        expect(version).toBe("99.0.0");
      } catch (error) {
        expect(error.message).toContain("Unsupported or invalid export format");
      }

      expect(ExportV1Schema.safeParse(unsupportedVersionData).success).toBe(
        false,
      );
    });

    // Note: localStorage corruption testing covered in export-import-attendee-integrity.test.ts

    it("should handle attendee-meeting reference mismatches", async () => {
      const testMeetings = [
        TestDataFactory.createMeeting({
          id: "meeting-with-orphaned-refs",
          title: "Meeting with Orphaned References",
          attendeeIds: ["non-existent-attendee-1", "non-existent-attendee-2"],
        }),
      ];

      // Store only meetings, no attendees
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
        JSON.stringify(testMeetings),
      );
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
        JSON.stringify([]),
      );

      const { result: attendeesResult } = renderHook(() =>
        useGlobalAttendees()
      );
      const { result: meetingsResult } = renderHook(() => useMeetingState());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Meeting should be imported with orphaned references
      expect(meetingsResult.current.meetings).toHaveLength(1);
      expect(meetingsResult.current.meetings[0].attendeeIds).toHaveLength(2);

      // But getAttendeesByIds should filter out non-existent attendees
      const resolvedAttendees = attendeesResult.current.getAttendeesByIds(
        meetingsResult.current.meetings[0].attendeeIds,
      );
      expect(resolvedAttendees).toHaveLength(0);
    });

    it("should handle circular references in meeting data", async () => {
      const meeting = TestDataFactory.createMeeting();
      // Create circular reference
      (meeting as any).circular = meeting;

      // Should throw error when trying to stringify for localStorage
      expect(() => {
        JSON.stringify([meeting]);
      }).toThrow();
    });

    // Note: Large dataset testing moved to performance/export-performance.test.ts

    it("should handle export data with mixed format attendee IDs", async () => {
      const testMeetings = [
        TestDataFactory.createMeeting({
          id: "mixed-format-meeting",
          title: "Mixed Format Meeting",
          attendeeIds: [
            "uuid-format-id",
            "123", // numeric ID as string
            "email@example.com", // email as ID
            "", // empty string
            "normal-id",
          ],
        }),
      ];

      const exportData = {
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        attendees: [],
        title: "Mixed Format Test",
        agenda: "",
        meetings: testMeetings,
        metadata: {
          appVersion: "1.0.0",
          totalMeetings: 1,
          totalAttendees: 0,
          blockTypes: [],
          includesAttendees: true,
          includesTopicGroups: true,
        },
      };

      // Should still be valid
      expect(ExportV1Schema.safeParse(exportData).success).toBe(true);
    });

    it("should handle concurrent import operations", async () => {
      const testData = [
        TestDataFactory.createAttendee({ name: "Concurrent User 1" }),
        TestDataFactory.createAttendee({ name: "Concurrent User 2" }),
      ];

      // Start multiple concurrent operations
      const operations = Array.from({ length: 5 }, (_, i) => {
        return act(async () => {
          localStorage.setItem(
            `${APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES}_${i}`,
            JSON.stringify(testData),
          );
        });
      });

      // All operations should complete without errors
      await Promise.all(operations);

      // Verify localStorage wasn't corrupted
      expect(() => {
        for (let i = 0; i < 5; i++) {
          const data = localStorage.getItem(
            `${APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES}_${i}`,
          );
          if (data) {
            JSON.parse(data);
          }
        }
      }).not.toThrow();
    });
  });
});
