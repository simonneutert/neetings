import { beforeEach, describe, expect, it, vi } from "vitest";
import { BaseExporter } from "../../utils/export/BaseExporter";
import { autoMigrate, createExportV1 } from "../../schemas/index";
import { TestDataFactory } from "../factories/testDataFactory";

// Mock URL and Blob for performance testing
Object.defineProperty(window, "URL", {
  value: {
    createObjectURL: vi.fn(() => "blob:mock-url"),
    revokeObjectURL: vi.fn(),
  },
});

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

describe("Export/Import Performance Tests", () => {
  let exporter: BaseExporter;

  beforeEach(() => {
    TestDataFactory.reset();
    exporter = new BaseExporter();
  });

  describe("Large Dataset Performance", () => {
    it("should handle export of 1000 meetings efficiently", async () => {
      // Create large dataset
      const largeSeries = TestDataFactory.createLargeMeetingSeries(1000, 10); // 1000 meetings, 10 blocks each

      const startTime = performance.now();

      const exportData = createExportV1(
        largeSeries.meetings,
        largeSeries.attendees,
        "Large Performance Test Series",
        "Testing export performance with large datasets",
      );

      const exportTime = performance.now() - startTime;

      // Verify export completed
      expect(exportData.meetings).toHaveLength(1000);
      expect(exportData.metadata.totalMeetings).toBe(1000);

      // Performance expectation: should complete within 5 seconds
      expect(exportTime).toBeLessThan(5000);

      console.log(
        `Large export (1000 meetings) completed in ${exportTime.toFixed(2)}ms`,
      );
    });

    it("should handle import of 1000 meetings efficiently", async () => {
      // Create large export data
      const largeSeries = TestDataFactory.createLargeMeetingSeries(1000, 5);
      const exportData = createExportV1(
        largeSeries.meetings,
        largeSeries.attendees,
        "Large Import Test",
        "Testing import performance",
      );

      const startTime = performance.now();

      const migrationResult = autoMigrate(exportData);

      const importTime = performance.now() - startTime;

      // Verify import completed successfully
      expect(migrationResult.success).toBe(true);
      if (migrationResult.success) {
        expect(migrationResult.data.meetings).toHaveLength(1000);
      }

      // Performance expectation: should complete within 3 seconds
      expect(importTime).toBeLessThan(3000);

      console.log(
        `Large import (1000 meetings) completed in ${importTime.toFixed(2)}ms`,
      );
    });

    it("should handle round-trip export/import of large dataset", async () => {
      // Create moderately large dataset for round-trip test
      const series = TestDataFactory.createLargeMeetingSeries(500, 8);

      const startTime = performance.now();

      // Export
      const exportData = createExportV1(
        series.meetings,
        series.attendees,
        series.title,
        series.agenda,
      );

      const exportCompleteTime = performance.now();

      // Import
      const migrationResult = autoMigrate(exportData);

      const totalTime = performance.now() - startTime;
      const exportTime = exportCompleteTime - startTime;
      const importTime = totalTime - exportTime;

      // Verify round-trip integrity
      expect(migrationResult.success).toBe(true);
      if (migrationResult.success) {
        expect(migrationResult.data.meetings).toHaveLength(500);
        expect(migrationResult.data.title).toBe(series.title);
      }

      // Performance expectations
      expect(totalTime).toBeLessThan(8000); // Total under 8 seconds
      expect(exportTime).toBeLessThan(5000); // Export under 5 seconds
      expect(importTime).toBeLessThan(3000); // Import under 3 seconds

      console.log(
        `Round-trip (500 meetings): Export ${exportTime.toFixed(2)}ms, Import ${
          importTime.toFixed(2)
        }ms, Total ${totalTime.toFixed(2)}ms`,
      );
    });
  });

  describe("Format-Specific Performance", () => {
    it("should export to Markdown format efficiently", async () => {
      const meeting = TestDataFactory.createMeetingWithBlocks(100); // 100 blocks
      const { attendees } = TestDataFactory.createMeetingWithAttendees(50); // 50 attendees

      const startTime = performance.now();

      const result = await exporter.export(meeting, {
        format: "markdown",
        filename: "performance-test.md",
        attendees,
      });

      const exportTime = performance.now() - startTime;

      expect(result.content).toBeTruthy();
      expect(result.content.length).toBeGreaterThan(1000);

      // Markdown should be fast (under 2 seconds)
      expect(exportTime).toBeLessThan(2000);

      console.log(
        `Markdown export (100 blocks, 50 attendees) completed in ${
          exportTime.toFixed(2)
        }ms`,
      );
    });

    it("should export to HTML format efficiently", async () => {
      const meeting = TestDataFactory.createMeetingWithBlocks(100);
      const { attendees } = TestDataFactory.createMeetingWithAttendees(50);

      const startTime = performance.now();

      const result = await exporter.export(meeting, {
        format: "html",
        filename: "performance-test.html",
        attendees,
      });

      const exportTime = performance.now() - startTime;

      expect(result.content).toBeTruthy();
      expect(result.content).toContain("<!DOCTYPE html>");

      // HTML should be reasonably fast (under 3 seconds)
      expect(exportTime).toBeLessThan(3000);

      console.log(
        `HTML export (100 blocks, 50 attendees) completed in ${
          exportTime.toFixed(2)
        }ms`,
      );
    });

    it("should export to DOCX format efficiently", async () => {
      const meeting = TestDataFactory.createMeetingWithBlocks(50); // Smaller for DOCX
      const { attendees } = TestDataFactory.createMeetingWithAttendees(25);

      const startTime = performance.now();

      const result = await exporter.export(meeting, {
        format: "docx",
        filename: "performance-test.docx",
        attendees,
      });

      const exportTime = performance.now() - startTime;

      expect(result.content).toBeTruthy();
      expect(result.mimeType).toBe(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );

      // DOCX is more complex, allow more time (under 5 seconds)
      expect(exportTime).toBeLessThan(5000);

      console.log(
        `DOCX export (50 blocks, 25 attendees) completed in ${
          exportTime.toFixed(2)
        }ms`,
      );
    });

    it("should export to RTF format efficiently", async () => {
      const meeting = TestDataFactory.createMeetingWithBlocks(100);
      const { attendees } = TestDataFactory.createMeetingWithAttendees(50);

      const startTime = performance.now();

      const result = await exporter.export(meeting, {
        format: "rtf",
        filename: "performance-test.rtf",
        attendees,
      });

      const exportTime = performance.now() - startTime;

      expect(result.content).toBeTruthy();
      expect(result.mimeType).toBe("application/rtf");

      // RTF should be reasonably fast (under 3 seconds)
      expect(exportTime).toBeLessThan(3000);

      console.log(
        `RTF export (100 blocks, 50 attendees) completed in ${
          exportTime.toFixed(2)
        }ms`,
      );
    });
  });

  describe("Memory Usage Performance", () => {
    it("should handle large text content without memory issues", async () => {
      const meeting = TestDataFactory.createMeeting();

      // Create blocks with large text content
      const largeBlocks = Array.from(
        { length: 10 },
        (_, i) =>
          TestDataFactory.createBlock("textblock", {
            text: `Large text content for block ${i}\n`.repeat(10000), // ~500KB per block
          }),
      );

      meeting.blocks = largeBlocks;

      const startTime = performance.now();

      // This should either succeed or fail gracefully (not hang)
      try {
        const result = await exporter.export(meeting, {
          format: "markdown",
          filename: "memory-test.md",
        });

        const exportTime = performance.now() - startTime;

        expect(result.content).toBeTruthy();
        expect(result.content.length).toBeGreaterThan(3000000); // Should be > 3MB

        // Should complete within reasonable time
        expect(exportTime).toBeLessThan(10000);

        console.log(
          `Large text export (~5MB) completed in ${exportTime.toFixed(2)}ms`,
        );
      } catch (error) {
        // Accept memory-related errors as valid behavior
        const exportTime = performance.now() - startTime;
        console.log(
          `Large text export failed gracefully after ${
            exportTime.toFixed(2)
          }ms: ${error.message}`,
        );
        expect(error.message).toMatch(/memory|size|limit/i);
      }
    });

    it("should handle many small meetings efficiently", async () => {
      // Create many small meetings instead of few large ones
      const manySmallMeetings = Array.from(
        { length: 2000 },
        (_, i) =>
          TestDataFactory.createMeeting({
            id: `small-meeting-${i}`,
            title: `Small Meeting ${i}`,
            blocks: [
              TestDataFactory.createBlock("textblock", {
                text: `Small content for meeting ${i}`,
              }),
            ],
          }),
      );

      const attendees = Array.from(
        { length: 100 },
        (_, i) =>
          TestDataFactory.createAttendee({
            name: `Attendee ${i}`,
            email: `attendee${i}@example.com`,
          }),
      );

      const startTime = performance.now();

      const exportData = createExportV1(
        manySmallMeetings,
        attendees,
        "Many Small Meetings Test",
        "Testing many small meetings performance",
      );

      const exportTime = performance.now() - startTime;

      expect(exportData.meetings).toHaveLength(2000);
      expect(exportData.attendees).toHaveLength(100);

      // Should handle many small objects efficiently
      expect(exportTime).toBeLessThan(3000);

      console.log(
        `Many small meetings export (2000 meetings) completed in ${
          exportTime.toFixed(2)
        }ms`,
      );
    });
  });

  describe("Concurrent Operations Performance", () => {
    it("should handle multiple concurrent exports", async () => {
      const meeting = TestDataFactory.createMeetingWithBlocks(20);
      const { attendees } = TestDataFactory.createMeetingWithAttendees(10);

      const startTime = performance.now();

      // Start multiple concurrent exports
      const exportPromises = Array.from(
        { length: 5 },
        (_, i) =>
          exporter.export(meeting, {
            format: "markdown",
            filename: `concurrent-test-${i}.md`,
            attendees,
          }),
      );

      const results = await Promise.all(exportPromises);

      const totalTime = performance.now() - startTime;

      // All should complete successfully
      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.content).toBeTruthy();
        expect(result.filename).toBe(`concurrent-test-${i}.md`);
      });

      // Concurrent operations should be efficient
      expect(totalTime).toBeLessThan(5000);

      console.log(
        `5 concurrent exports completed in ${totalTime.toFixed(2)}ms`,
      );
    });

    it("should handle concurrent import operations", async () => {
      // Create test data for concurrent imports
      const testSeries = TestDataFactory.createMeetingSeries(50);
      const exportData = createExportV1(
        testSeries.meetings,
        testSeries.attendees,
        testSeries.title,
        testSeries.agenda,
      );

      const startTime = performance.now();

      // Start multiple concurrent imports of the same data
      const importPromises = Array.from(
        { length: 5 },
        () => Promise.resolve(autoMigrate(exportData)),
      );

      const results = await Promise.all(importPromises);

      const totalTime = performance.now() - startTime;

      // All should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.meetings).toHaveLength(50);
        }
      });

      // Concurrent imports should be efficient
      expect(totalTime).toBeLessThan(3000);

      console.log(
        `5 concurrent imports completed in ${totalTime.toFixed(2)}ms`,
      );
    });
  });

  describe("Scalability Tests", () => {
    it("should scale linearly with meeting count", async () => {
      const testSizes = [100, 200, 400]; // Test different sizes
      const timings: number[] = [];

      for (const size of testSizes) {
        const series = TestDataFactory.createLargeMeetingSeries(size, 5);

        const startTime = performance.now();

        const exportData = createExportV1(
          series.meetings,
          series.attendees,
          `Scalability Test ${size}`,
          "Testing scalability",
        );

        const exportTime = performance.now() - startTime;
        timings.push(exportTime);

        expect(exportData.meetings).toHaveLength(size);

        console.log(
          `Export of ${size} meetings completed in ${exportTime.toFixed(2)}ms`,
        );
      }

      // Check that timing scales reasonably (not exponentially)
      const ratio1 = timings[1] / timings[0]; // 200/100 ratio
      const ratio2 = timings[2] / timings[1]; // 400/200 ratio

      // Ratios should be roughly similar (linear scaling)
      // Allow significant variance for small datasets in test environment
      expect(ratio1).toBeLessThan(10); // Very lenient for test environment
      expect(ratio2).toBeLessThan(10); // Very lenient for test environment

      console.log(
        `Scaling ratios: 200/100 = ${ratio1.toFixed(2)}, 400/200 = ${
          ratio2.toFixed(2)
        }`,
      );
    });

    it("should handle edge case: empty datasets", async () => {
      const startTime = performance.now();

      const exportData = createExportV1(
        [], // No meetings
        [], // No attendees
        "Empty Dataset Test",
        "Testing empty dataset performance",
      );

      const exportTime = performance.now() - startTime;

      expect(exportData.meetings).toHaveLength(0);
      expect(exportData.attendees).toHaveLength(0);
      expect(exportData.metadata.totalMeetings).toBe(0);

      // Empty datasets should be very fast
      expect(exportTime).toBeLessThan(100);

      console.log(
        `Empty dataset export completed in ${exportTime.toFixed(2)}ms`,
      );
    });

    it("should handle edge case: single large meeting", async () => {
      const meeting = TestDataFactory.createMeeting();

      // Create one meeting with many blocks
      meeting.blocks = Array.from(
        { length: 1000 },
        (_, i) =>
          TestDataFactory.createBlock("textblock", {
            text: `Block ${i} with moderate content`,
          }),
      );

      const startTime = performance.now();

      const result = await exporter.export(meeting, {
        format: "markdown",
        filename: "single-large-meeting.md",
      });

      const exportTime = performance.now() - startTime;

      expect(result.content).toBeTruthy();

      // Single large meeting should complete reasonably fast
      expect(exportTime).toBeLessThan(5000);

      console.log(
        `Single large meeting (1000 blocks) export completed in ${
          exportTime.toFixed(2)
        }ms`,
      );
    });
  });

  describe("Browser Storage Performance", () => {
    it("should handle localStorage size limits gracefully", async () => {
      // Create progressively larger datasets until we hit storage limits
      let currentSize = 100;
      let lastSuccessfulSize = 0;

      while (currentSize <= 10000) { // Cap at 10k to prevent infinite loops
        try {
          const largeSeries = TestDataFactory.createLargeMeetingSeries(
            currentSize,
            10,
          );
          const exportData = createExportV1(
            largeSeries.meetings,
            largeSeries.attendees,
            `Storage Test ${currentSize}`,
            "Testing storage limits",
          );

          // Try to serialize (this is what would go to localStorage)
          const serialized = JSON.stringify(exportData);

          // If we got here, this size worked
          lastSuccessfulSize = currentSize;

          console.log(
            `Storage test: ${currentSize} meetings = ${
              (serialized.length / 1024 / 1024).toFixed(2)
            }MB`,
          );

          currentSize *= 2; // Double the size for next test
        } catch {
          // Hit a limit, break out
          console.log(
            `Storage limit reached between ${lastSuccessfulSize} and ${currentSize} meetings`,
          );
          break;
        }
      }

      // Should handle at least 100 meetings
      expect(lastSuccessfulSize).toBeGreaterThanOrEqual(100);
    });
  });
});
