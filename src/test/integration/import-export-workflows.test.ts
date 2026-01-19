import { beforeEach, describe, expect, it, vi } from "vitest";
import { BaseExporter } from "../../utils/export/BaseExporter";
import { autoMigrate, createExportV1 } from "../../schemas/index";
import { TestDataFactory } from "../factories/testDataFactory";
import { ExportErrorHandler } from "../../utils/export/errors/ErrorHandler";

// Mock file operations for testing
const createMockFile = (content: string, filename = "test.json") => {
  const mockFile = {
    name: filename,
    type: "application/json",
    size: content.length,
    text: vi.fn().mockResolvedValue(content),
    arrayBuffer: vi.fn().mockResolvedValue(
      new TextEncoder().encode(content).buffer,
    ),
  };
  return mockFile as unknown as File;
};

// Mock URL for testing file downloads
Object.defineProperty(window, "URL", {
  value: {
    createObjectURL: vi.fn(() => "blob:mock-url"),
    revokeObjectURL: vi.fn(),
  },
});

// Mock document for testing file downloads
Object.defineProperty(document, "createElement", {
  value: vi.fn(() => ({
    href: "",
    download: "",
    style: { display: "" },
    click: vi.fn(),
  })),
});

Object.defineProperty(document.body, "appendChild", { value: vi.fn() });
Object.defineProperty(document.body, "removeChild", { value: vi.fn() });

// Mock Blob for file generation - use a class for Vitest 4.0 compatibility
global.Blob = class MockBlob {
  constructor(content, options) {
    this.size = Array.isArray(content) ? content.join("").length : 1024;
    this.type = options?.type || "application/octet-stream";
  }

  async arrayBuffer() {
    return new ArrayBuffer(8);
  }
} as any;

describe("Import/Export Workflow Integration Tests", () => {
  let exporter: BaseExporter;

  beforeEach(() => {
    TestDataFactory.reset();
    exporter = new BaseExporter();
  });

  describe("Complete Export → Import Cycles", () => {
    // Note: Basic export functionality tested in export.test.ts
    // This focuses on true integration scenarios

    it("should handle complete JSON export → import cycle", async () => {
      // Step 1: Create comprehensive test data
      const originalSeries = TestDataFactory.createMeetingSeries(2, {
        title: "Complete Workflow Test Series",
        agenda: "Testing full import/export cycle",
      });

      // Step 2: Export to v1.0.0 format
      const exportData = createExportV1(
        originalSeries.meetings,
        originalSeries.attendees,
        originalSeries.title,
        originalSeries.agenda,
      );

      // Step 3: Verify export structure
      expect(exportData.version).toBe("1.0.0");
      expect(exportData.title).toBe("Complete Workflow Test Series");
      expect(exportData.meetings).toHaveLength(2);
      expect(exportData.attendees).toHaveLength(3);
      expect(exportData.metadata.totalMeetings).toBe(2);
      expect(exportData.metadata.totalAttendees).toBe(3);

      // Step 4: Simulate file creation and import
      const jsonContent = JSON.stringify(exportData, null, 2);
      const importFile = createMockFile(jsonContent, "test-export.json");

      expect(importFile.name).toBe("test-export.json");
      expect(importFile.type).toBe("application/json");

      // Step 5: Import and migrate
      const importContent = await importFile.text();
      const parsedData = JSON.parse(importContent);
      const migrationResult = autoMigrate(parsedData);

      // Step 6: Verify import success
      expect(migrationResult.success).toBe(true);
      if (migrationResult.success) {
        expect(migrationResult.data.title).toBe(
          "Complete Workflow Test Series",
        );
        expect(migrationResult.data.agenda).toBe(
          "Testing full import/export cycle",
        );
        expect(migrationResult.data.meetings).toHaveLength(2);
        expect(migrationResult.data.attendees).toHaveLength(3);

        // Verify attendee integrity
        const importedAttendees = migrationResult.data.attendees;
        const originalAttendeeIds = originalSeries.attendees.map((a: any) =>
          a.id
        );
        const importedAttendeeIds = importedAttendees.map((a: any) => a.id);
        expect(importedAttendeeIds).toEqual(originalAttendeeIds);
      }
    });

    // Note: HTML export testing covered in export.test.ts
    // Removed redundant HTML export test

    // Note: DOCX export testing covered in export.test.ts
    // Removed redundant DOCX export test
  });

  describe("Format-Specific Round-Trip Testing", () => {
    it("should preserve all data through JSON round-trip", async () => {
      // Step 1: Create rich test data
      const originalSeries = TestDataFactory.createMeetingSeries(3, {
        title: "Round-Trip Preservation Test",
        agenda: "Ensuring data integrity through export/import",
      });

      // Add complex block structures
      originalSeries.meetings.forEach((meeting, index) => {
        meeting.blocks = [
          TestDataFactory.createBlock("textblock", {
            text: `Meeting ${index + 1} notes`,
          }),
          TestDataFactory.createBlock("todoblock", {
            todo: `Task for meeting ${index + 1}`,
            completed: index === 0,
          }),
          TestDataFactory.createBlock("qandablock", {
            question: `Question for meeting ${index + 1}?`,
            answer: `Answer for meeting ${index + 1}`,
          }),
        ];
      });

      // Step 2: First export
      const firstExport = createExportV1(
        originalSeries.meetings,
        originalSeries.attendees,
        originalSeries.title,
        originalSeries.agenda,
      );

      // Step 3: Import
      const importResult = autoMigrate(firstExport);
      expect(importResult.success).toBe(true);

      // Step 4: Second export from imported data
      if (importResult.success) {
        const secondExport = createExportV1(
          importResult.data.meetings,
          importResult.data.attendees,
          importResult.data.title,
          importResult.data.agenda,
        );

        // Step 5: Verify perfect preservation
        expect(secondExport.title).toBe(firstExport.title);
        expect(secondExport.agenda).toBe(firstExport.agenda);
        expect(secondExport.meetings).toHaveLength(firstExport.meetings.length);
        expect(secondExport.attendees).toHaveLength(
          firstExport.attendees.length,
        );

        // Verify meeting content preservation
        secondExport.meetings.forEach((meeting, index) => {
          const originalMeeting = firstExport.meetings[index];
          expect(meeting.title).toBe(originalMeeting.title);
          expect(meeting.blocks).toHaveLength(originalMeeting.blocks.length);
          expect(meeting.attendeeIds).toEqual(originalMeeting.attendeeIds);
        });
      }
    });

    it("should handle legacy format migration during round-trip", async () => {
      // Step 1: Create legacy format data (meetings array only)
      const legacyMeetings = [
        TestDataFactory.createMeeting({ title: "Legacy Meeting 1" }),
        TestDataFactory.createMeeting({ title: "Legacy Meeting 2" }),
      ];

      // Step 2: Import legacy format
      const migrationResult = autoMigrate(legacyMeetings);
      expect(migrationResult.success).toBe(true);

      // Step 3: Verify migration to current format
      if (migrationResult.success) {
        // The migrated data has the modern structure now
        expect(migrationResult.data.meetings).toBeDefined();
        expect(migrationResult.data.title).toBe("Meeting Series"); // Default title
        expect(migrationResult.data.agenda).toBe(""); // Default agenda
        expect(migrationResult.data.meetings).toHaveLength(2);
        expect(migrationResult.data.attendees).toEqual([]); // No attendees in legacy
        expect(migrationResult.fromVersion).toBe("legacy");
        expect(migrationResult.toVersion).toBe("1.0.0");

        // Step 4: Export migrated data
        const modernExport = createExportV1(
          migrationResult.data.meetings,
          migrationResult.data.attendees,
          migrationResult.data.title,
          migrationResult.data.agenda,
        );

        // Step 5: Verify modern export structure
        expect(modernExport.version).toBe("1.0.0");
        expect(modernExport.meetings[0].title).toBe("Legacy Meeting 1");
        expect(modernExport.meetings[1].title).toBe("Legacy Meeting 2");
        expect(modernExport.metadata.totalMeetings).toBe(2);
        expect(modernExport.metadata.totalAttendees).toBe(0);
      }
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle corrupted JSON files gracefully", async () => {
      // Step 1: Create corrupted JSON content
      const corruptedJson = '{"version": "1.0.0", "meetings": [{"id": "test"'; // Incomplete JSON

      // Step 2: Create mock file with corrupted content
      const corruptedFile = createMockFile(corruptedJson, "corrupted.json");

      // Step 3: Suppress expected console errors
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(
        () => {},
      );

      try {
        // Step 4: Attempt to parse
        const content = await corruptedFile.text();
        JSON.parse(content);
        // Should not reach this point
        expect(false).toBe(true);
      } catch (error) {
        // Step 5: Verify error handling
        const handledError = ExportErrorHandler.handleImportError(error);
        expect(handledError.success).toBe(false);
        expect(handledError.errors?.[0].message).toContain("wrong");
      } finally {
        // Step 6: Restore console
        consoleSpy.mockRestore();
      }
    });

    it("should handle unsupported file types", async () => {
      // Step 1: Create file with wrong type
      const textFile = new File(["some text content"], "test.txt", {
        type: "text/plain",
      });

      // Step 2: Validate file type
      try {
        ExportErrorHandler.validateFileBeforeProcessing(textFile);
        // Should not reach this point
        expect(false).toBe(true);
      } catch (error) {
        // Step 3: Verify error handling
        expect(error.message).toContain("Unsupported file type");
      }
    });

    it("should handle oversized files", async () => {
      // Step 1: Create mock oversized file (smaller for test performance)
      const oversizedContent = "x".repeat(10 * 1024 * 1024); // 10MB
      const oversizedFile = new File([oversizedContent], "huge.json", {
        type: "application/json",
      });

      // Override the file size to simulate a 60MB file
      Object.defineProperty(oversizedFile, "size", {
        value: 60 * 1024 * 1024, // 60MB
        writable: false,
      });

      // Step 2: Validate file size
      try {
        ExportErrorHandler.validateFileBeforeProcessing(oversizedFile);
        // Should not reach this point
        expect(false).toBe(true);
      } catch (error) {
        // Step 3: Verify error handling
        expect(error.message).toContain("File size");
        expect(error.message).toContain("exceeds maximum");
      }
    });
  });

  describe("Real File I/O Simulation", () => {
    it("should simulate realistic file upload flow", async () => {
      // Step 1: Create realistic export data
      const testData = TestDataFactory.createMeetingSeries(1, {
        title: "File I/O Test Series",
        agenda: "Testing realistic file operations",
      });

      const exportData = createExportV1(
        testData.meetings,
        testData.attendees,
        testData.title,
        testData.agenda,
      );

      // Step 2: Convert to JSON string (what would be saved to file)
      const jsonString = JSON.stringify(exportData, null, 2);
      expect(jsonString.length).toBeGreaterThan(100); // Should be substantial content

      // Step 3: Create File object (simulates user selecting file)
      const uploadFile = createMockFile(jsonString, "realistic-test.json");

      // Step 4: Validate file before processing
      expect(() => {
        ExportErrorHandler.validateFileBeforeProcessing(uploadFile);
      }).not.toThrow();

      // Step 5: Process file content (simulate reading uploaded file)
      const fileContent = await uploadFile.text();
      const parsedContent = await ExportErrorHandler.safeJsonParse(fileContent);

      // Step 6: Verify content integrity
      expect(parsedContent.version).toBe("1.0.0");
      expect(parsedContent.title).toBe("File I/O Test Series");
      expect(parsedContent.meetings).toHaveLength(1);

      // Step 7: Complete import process
      const migrationResult = autoMigrate(parsedContent);
      expect(migrationResult.success).toBe(true);
    });

    // Note: Filename generation testing covered in enhanced-export-import.test.ts
    // Removed redundant filename generation test
  });

  describe("Performance and Scale Testing", () => {
    it("should handle moderately large datasets efficiently", async () => {
      // Step 1: Create larger dataset
      const largeSeries = TestDataFactory.createLargeMeetingSeries(10, 5); // 10 meetings, 5 blocks each

      // Step 2: Measure export performance
      const startTime = Date.now();
      const exportData = createExportV1(
        largeSeries.meetings,
        largeSeries.attendees,
        largeSeries.title,
        largeSeries.agenda,
      );
      const exportTime = Date.now() - startTime;

      // Step 3: Verify export completed reasonably quickly (< 1 second for this size)
      expect(exportTime).toBeLessThan(1000);
      expect(exportData.meetings).toHaveLength(10);
      expect(exportData.metadata.totalMeetings).toBe(10);

      // Step 4: Test import performance
      const importStartTime = Date.now();
      const migrationResult = autoMigrate(exportData);
      const importTime = Date.now() - importStartTime;

      // Step 5: Verify import completed efficiently
      expect(importTime).toBeLessThan(500);
      expect(migrationResult.success).toBe(true);
    });

    it("should handle export to different formats efficiently", async () => {
      // Step 1: Create test meeting
      const meeting = TestDataFactory.createMeetingWithBlocks(10);
      const { attendees } = TestDataFactory.createMeetingWithAttendees(5);

      // Step 2: Test all supported formats
      const formats = ["markdown", "html", "rtf", "docx"] as const;

      for (const format of formats) {
        const startTime = Date.now();

        const result = await exporter.export(meeting, {
          format,
          filename: `test.${format}`,
          attendees,
        });

        const exportTime = Date.now() - startTime;

        // Step 3: Verify each format completes efficiently
        expect(exportTime).toBeLessThan(2000); // Allow more time for DOCX
        expect(result.content).toBeTruthy();
        expect(result.filename).toContain(format);
      }
    });
  });
});
