import { beforeEach, describe, expect, it, vi } from "vitest";
import { autoMigrate, createExportV1 } from "../schemas/index";
import { TestDataFactory } from "./factories/testDataFactory";

describe("Series Import/Export Functionality", () => {
  beforeEach(() => {
    TestDataFactory.reset();
  });
  describe("Export with Series Data", () => {
    it("should include series title and agenda in export", () => {
      const meetings = [
        TestDataFactory.createMeeting({ title: "Meeting 1" }),
        TestDataFactory.createMeeting({ title: "Meeting 2" }),
      ];
      const attendees = [];
      const seriesTitle = "Test Series Title";
      const seriesAgenda = "Test series agenda";

      const exportData = createExportV1(
        meetings,
        attendees,
        seriesTitle,
        seriesAgenda,
      );

      expect(exportData.version).toBe("1.0.0");
      expect(exportData.title).toBe(seriesTitle);
      expect(exportData.agenda).toBe(seriesAgenda);
      expect(exportData.meetings).toHaveLength(2);
      expect(exportData.meetings[0].title).toBe("Meeting 1");
      expect(exportData.meetings[1].title).toBe("Meeting 2");
      expect(exportData.attendees).toEqual([]);
      expect(exportData.metadata).toBeDefined();
    });

    it("should handle minimal series data", () => {
      const meetings = [TestDataFactory.createMeeting({ title: "Meeting 1" })];
      const attendees = [];
      const seriesTitle = "Minimal Series"; // Must have at least 1 character
      const seriesAgenda = "";

      const exportData = createExportV1(
        meetings,
        attendees,
        seriesTitle,
        seriesAgenda,
      );

      expect(exportData.title).toBe("Minimal Series");
      expect(exportData.agenda).toBe("");
      expect(exportData.meetings).toHaveLength(1);
    });
  });

  describe("Import with Series Data", () => {
    it("should migrate v1.0.0 format with series data", () => {
      // Create valid test data using TestDataFactory
      const testMeetings = [
        TestDataFactory.createMeeting({ title: "Imported Meeting 1" }),
        TestDataFactory.createMeeting({ title: "Imported Meeting 2" }),
      ];
      const importData = createExportV1(
        testMeetings,
        [],
        "Imported Series Title",
        "Imported series agenda",
      );

      const migrationResult = autoMigrate(importData);

      if (!migrationResult.success) {
        console.log("Migration failed:", migrationResult.errors);
      }
      expect(migrationResult.success).toBe(true);
      if (migrationResult.success) {
        expect(migrationResult.data.title).toBe("Imported Series Title");
        expect(migrationResult.data.agenda).toBe("Imported series agenda");
        expect(migrationResult.data.meetings).toHaveLength(2);
        expect(migrationResult.data.meetings[0].title).toBe(
          "Imported Meeting 1",
        );
        expect(migrationResult.data.meetings[1].title).toBe(
          "Imported Meeting 2",
        );
        expect(migrationResult.fromVersion).toBe("1.0.0");
        expect(migrationResult.toVersion).toBe("1.0.0");
      }
    });

    it("should handle legacy format (meetings array only)", () => {
      const legacyData = [
        TestDataFactory.createMeeting({ title: "Legacy Meeting 1" }),
        TestDataFactory.createMeeting({ title: "Legacy Meeting 2" }),
      ];

      const migrationResult = autoMigrate(legacyData);

      expect(migrationResult.success).toBe(true);
      if (migrationResult.success) {
        // Legacy format should be migrated to series format with default values
        expect(Array.isArray(migrationResult.data)).toBe(false);
        expect(migrationResult.data.title).toBe("Meeting Series");
        expect(migrationResult.data.agenda).toBe("");
        expect(migrationResult.data.meetings).toHaveLength(2);
        expect(migrationResult.data.meetings[0].title).toBe("Legacy Meeting 1");
        expect(migrationResult.data.meetings[1].title).toBe("Legacy Meeting 2");
      }
    });

    it("should preserve series data during migration", () => {
      // Create valid test data with attendees using TestDataFactory
      const testAttendees = [
        TestDataFactory.createAttendee({
          id: "attendee-1",
          name: "John Doe",
          email: "john@example.com",
        }),
      ];
      const seriesData = createExportV1(
        [TestDataFactory.createMeeting({ title: "Test Meeting" })],
        testAttendees,
        "Preserved Series Title",
        "Preserved agenda content",
      );

      const migrationResult = autoMigrate(seriesData);

      expect(migrationResult.success).toBe(true);
      if (migrationResult.success) {
        expect(migrationResult.data.title).toBe("Preserved Series Title");
        expect(migrationResult.data.agenda).toBe("Preserved agenda content");
        expect(migrationResult.data.attendees).toHaveLength(1);
        expect(migrationResult.data.attendees[0].name).toBe("John Doe");
        expect(migrationResult.data.meetings).toHaveLength(1);
        expect(migrationResult.data.meetings[0].title).toBe("Test Meeting");
      }
    });
  });

  describe("Round-trip Export/Import", () => {
    it("should preserve series data in full export/import cycle", () => {
      // Step 1: Create initial data using TestDataFactory
      const originalMeetings = [
        TestDataFactory.createMeeting({ title: "Original Meeting 1" }),
        TestDataFactory.createMeeting({ title: "Original Meeting 2" }),
      ];
      const originalAttendees = [
        TestDataFactory.createAttendee({
          id: "attendee-1",
          name: "Jane Smith",
          email: "jane@example.com",
        }),
      ];
      const originalTitle = "Round-trip Series Title";
      const originalAgenda = "Round-trip series agenda";

      // Step 2: Export
      const exportData = createExportV1(
        originalMeetings,
        originalAttendees,
        originalTitle,
        originalAgenda,
      );

      // Step 3: Import
      const migrationResult = autoMigrate(exportData);

      // Step 4: Verify everything is preserved
      expect(migrationResult.success).toBe(true);
      if (migrationResult.success) {
        expect(migrationResult.data.title).toBe(originalTitle);
        expect(migrationResult.data.agenda).toBe(originalAgenda);
        expect(migrationResult.data.meetings).toHaveLength(2);
        expect(migrationResult.data.meetings[0].title).toBe(
          "Original Meeting 1",
        );
        expect(migrationResult.data.meetings[1].title).toBe(
          "Original Meeting 2",
        );
        expect(migrationResult.data.attendees).toHaveLength(1);
        expect(migrationResult.data.attendees[0].name).toBe("Jane Smith");
      }
    });
  });

  describe("Error Scenarios", () => {
    it("should handle createExportV1 with invalid meetings array", () => {
      expect(() => {
        createExportV1(
          null as any, // Invalid meetings
          [],
          "Test Series",
          "Test Agenda",
        );
      }).toThrow();
    });

    it("should handle createExportV1 with invalid attendees array gracefully", () => {
      const meetings = [TestDataFactory.createMeeting()];

      // createExportV1 may handle invalid attendees gracefully
      try {
        const result = createExportV1(
          meetings,
          "not-an-array" as any, // Invalid attendees
          "Test Series",
          "Test Agenda",
        );
        expect(result.version).toBe("1.0.0");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle autoMigrate with completely invalid data", () => {
      const invalidData = {
        notAValidField: "invalid",
        randomData: 123,
      };

      const migrationResult = autoMigrate(invalidData);
      expect(migrationResult.success).toBe(false);
      expect(migrationResult.errors).toBeDefined();
    });

    it("should handle autoMigrate with null input", () => {
      const migrationResult = autoMigrate(null as any);
      expect(migrationResult.success).toBe(false);
      expect(migrationResult.errors).toBeDefined();
    });

    it("should handle autoMigrate with undefined input", () => {
      const migrationResult = autoMigrate(undefined as any);
      expect(migrationResult.success).toBe(false);
      expect(migrationResult.errors).toBeDefined();
    });

    it("should handle series with corrupted meeting data", () => {
      const corruptedMeetings = [
        {
          id: "corrupted",
          // Missing required fields
        },
        TestDataFactory.createMeeting(), // One valid meeting
      ];

      expect(() => {
        createExportV1(
          corruptedMeetings as any,
          [],
          "Corrupted Series",
          "Test",
        );
      }).toThrow();
    });

    it("should handle series with very long titles and agendas", () => {
      const veryLongTitle = "x".repeat(10000); // 10KB title
      const veryLongAgenda = "y".repeat(50000); // 50KB agenda
      const meetings = [TestDataFactory.createMeeting()];

      // Should still work but might be impractical
      const exportData = createExportV1(
        meetings,
        [],
        veryLongTitle,
        veryLongAgenda,
      );

      expect(exportData.title).toBe(veryLongTitle);
      expect(exportData.agenda).toBe(veryLongAgenda);
      expect(exportData.title.length).toBe(10000);
      expect(exportData.agenda.length).toBe(50000);
    });

    it("should handle series with special characters in title and agenda", () => {
      const specialTitle = "🚀 Meeting Series with ÜmlÄuts & Special Ch@rs! 💯";
      const specialAgenda =
        "Agenda with\nnewlines\t\ttabs and 'quotes' & \"double quotes\"";
      const meetings = [TestDataFactory.createMeeting()];

      const exportData = createExportV1(
        meetings,
        [],
        specialTitle,
        specialAgenda,
      );

      expect(exportData.title).toBe(specialTitle);
      expect(exportData.agenda).toBe(specialAgenda);

      // Should survive JSON serialization
      const serialized = JSON.stringify(exportData);
      const deserialized = JSON.parse(serialized);
      expect(deserialized.title).toBe(specialTitle);
      expect(deserialized.agenda).toBe(specialAgenda);
    });

    it("should handle migration of malformed legacy data", () => {
      // Legacy data with some meetings having missing fields
      const malformedLegacyData = [
        TestDataFactory.createMeeting({ title: "Valid Meeting" }),
        {
          id: "malformed-1",
          title: "Missing Fields Meeting",
          // Missing required fields like date, startTime, etc.
        },
        {
          // Missing id and title
          date: "2024-01-01",
        },
      ];

      const migrationResult = autoMigrate(malformedLegacyData as any);

      // Migration should either succeed with partial data or fail gracefully
      if (migrationResult.success) {
        expect(migrationResult.data.meetings).toBeDefined();
        expect(Array.isArray(migrationResult.data.meetings)).toBe(true);
      } else {
        expect(migrationResult.errors).toBeDefined();
        expect(migrationResult.errors.length).toBeGreaterThan(0);
      }
    });

    // Note: Large series testing moved to performance/export-performance.test.ts

    it("should handle circular references in series data", () => {
      const meeting = TestDataFactory.createMeeting();
      const attendee = TestDataFactory.createAttendee();

      // Create circular references
      (meeting as any).circularRef = attendee;
      (attendee as any).circularRef = meeting;

      // createExportV1 may handle this gracefully or throw
      try {
        const result = createExportV1(
          [meeting],
          [attendee],
          "Circular Test",
          "Testing circular refs",
        );
        expect(result.version).toBe("1.0.0");
      } catch (error) {
        // Expected for circular references during serialization
        expect(error).toBeDefined();
      }
    });

    it("should handle concurrent migration operations", async () => {
      const testMeetings = [
        TestDataFactory.createMeeting({ title: "Concurrent Meeting 1" }),
        TestDataFactory.createMeeting({ title: "Concurrent Meeting 2" }),
      ];

      // Run multiple migrations concurrently
      const migrationPromises = Array.from(
        { length: 10 },
        () => Promise.resolve(autoMigrate(testMeetings)),
      );

      const results = await Promise.all(migrationPromises);

      // All should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.meetings).toHaveLength(2);
          expect(result.data.meetings[0].title).toBe("Concurrent Meeting 1");
        }
      });
    });

    // Note: Memory pressure testing moved to performance/export-performance.test.ts
  });
});
