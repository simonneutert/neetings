import { beforeEach, describe, expect, it, vi } from "vitest";
import { BaseExporter } from "../utils/export/BaseExporter";
import { MarkdownTransformer } from "../utils/export/transformers/MarkdownTransformer";
import { HTMLTransformer } from "../utils/export/transformers/HTMLTransformer";
import { DOCXTransformer } from "../utils/export/transformers/DOCXTransformer";
import { TestDataFactory } from "./factories/testDataFactory";

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

// Mock Blob for DOCX testing - use a class for Vitest 4.0 compatibility
global.Blob = class MockBlob {
  constructor(content, options) {
    this.size = Array.isArray(content) ? content.join("").length : 1024;
    this.type = options?.type || "application/octet-stream";
  }

  async arrayBuffer() {
    return new ArrayBuffer(8);
  }
} as any;

// Reset factory counter before each test for consistent IDs
beforeEach(() => {
  TestDataFactory.reset();
});

describe("Export functionality", () => {
  describe("BaseExporter", () => {
    it("should create an instance with all transformers", () => {
      const exporter = new BaseExporter();
      const supportedFormats = exporter.getSupportedFormats();
      expect(supportedFormats).toContain("markdown");
      expect(supportedFormats).toContain("rtf");
      expect(supportedFormats).toContain("docx");
      expect(supportedFormats).toContain("html");
    });

    it("should generate default filename correctly", () => {
      const exporter = new BaseExporter();
      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "Project Kickoff Meeting",
      });

      const filename = exporter.generateDefaultFilename(meeting, "markdown");
      expect(filename).toBe("project_kickoff_meeting_2024-01-15.md");
    });

    it("should sanitize meeting title in filename", () => {
      const exporter = new BaseExporter();
      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "Meeting with Special @#$% Characters!",
      });

      const filename = exporter.generateDefaultFilename(meeting, "markdown");
      // Title gets truncated to 30 chars: "Meeting with Special @#$% Char"
      // Then sanitized: "meeting_with_special_char"
      expect(filename).toBe("meeting_with_special_char_2024-01-15.md");
    });

    it("should limit meeting title to 30 characters in filename", () => {
      const exporter = new BaseExporter();
      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title:
          "This is a Very Long Meeting Title That Exceeds Thirty Characters Easily",
      });

      const filename = exporter.generateDefaultFilename(meeting, "markdown");
      expect(filename).toBe("this_is_a_very_long_meeting_ti_2024-01-15.md");

      // Verify the title part is exactly 30 characters before processing
      const titlePart = "This is a Very Long Meeting Ti"; // 30 chars
      const sanitized = titlePart.replace(/[^a-zA-Z0-9-_\s]/g, "").replace(
        /\s+/g,
        "_",
      ).toLowerCase();
      expect(filename).toBe(`${sanitized}_2024-01-15.md`);
    });

    it("should throw error for unsupported format", async () => {
      const exporter = new BaseExporter();
      const meeting = TestDataFactory.createMeeting();

      await expect(
        exporter.export(meeting, {
          format: "pdf" as any,
          filename: "test.pdf",
        }),
      ).rejects.toThrow("Unsupported export format: pdf");
    });
  });

  describe("MarkdownTransformer", () => {
    it("should transform simple meeting to markdown", async () => {
      const transformer = new MarkdownTransformer();
      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "Simple Meeting",
        date: "2024-01-15",
        startTime: "10:00",
        endTime: "11:00",
        created_at: "2024-01-15T10:00:00.000Z",
        updated_at: "2024-01-15T11:00:00.000Z",
      });

      const result = await transformer.transform({
        meeting,
        options: { format: "markdown", filename: "test.md" },
      });

      expect(result.content).toContain("# Simple Meeting");
      expect(result.content).toContain("*Created: January 15, 2024");
      expect(result.content).toContain("Total Blocks: 0*");
      expect(result.content).toContain("**Date:** January 15, 2024");
      expect(result.content).toContain("**Time:** 10:00 - 11:00");
      expect(result.filename).toBe("test.md");
      expect(result.mimeType).toBe("text/markdown");
    });

    it("should include table of contents when topic groups exist", async () => {
      const transformer = new MarkdownTransformer();
      const topicGroups = [
        TestDataFactory.createTopicGroup("test", {
          id: "tg1",
          name: "To Do",
          order: 0,
        }),
        TestDataFactory.createTopicGroup("test", {
          id: "tg2",
          name: "In Progress",
          order: 1,
        }),
        TestDataFactory.createTopicGroup("test", {
          id: "tg3",
          name: "Done",
          order: 2,
        }),
      ];
      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "Kanban Meeting",
        blocks: [],
        topicGroups,
      });

      const result = await transformer.transform({
        meeting,
        options: { format: "markdown", filename: "test.md" },
      });

      expect(result.content).toContain("## Table of Contents");
      expect(result.content).toContain("- [To Do](#to-do)");
      expect(result.content).toContain("- [In Progress](#in-progress)");
      expect(result.content).toContain("- [Done](#done)");
    });

    it("should format different block types correctly", async () => {
      const transformer = new MarkdownTransformer();
      const blocks = [
        TestDataFactory.createBlock("textblock", { text: "This is a note" }),
        TestDataFactory.createBlock("todoblock", {
          todo: "Complete the task",
          completed: false,
        }),
        TestDataFactory.createBlock("qandablock", {
          question: "What is this?",
          answer: "This is an answer",
        }),
        TestDataFactory.createBlock("researchblock", {
          topic: "Research topic",
          result: "Research findings",
        }),
      ];

      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "Block Types Meeting",
        blocks,
      });

      const result = await transformer.transform({
        meeting,
        options: { format: "markdown", filename: "test.md" },
      });

      expect(result.content).toContain("**[NOTE]**\nThis is a note");
      expect(result.content).toContain("**[TODO]**\n- [ ] Complete the task");
      expect(result.content).toContain(
        "**[Q&A]**\nQ: What is this?\nA: This is an answer",
      );
      expect(result.content).toContain(
        "**[RESEARCH]**\nTopic: Research topic\nResult: Research findings",
      );
    });

    it("should handle completed TODO blocks", async () => {
      const transformer = new MarkdownTransformer();
      const todoBlock = TestDataFactory.createBlock("todoblock", {
        todo: "Completed task",
        completed: true,
      });

      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "TODO Meeting",
        blocks: [todoBlock],
      });

      const result = await transformer.transform({
        meeting,
        options: { format: "markdown", filename: "test.md" },
      });

      expect(result.content).toContain("**[TODO]**\n- [x] Completed task");
    });

    it("should organize blocks by topic groups", async () => {
      const transformer = new MarkdownTransformer();
      const topicGroups = [
        TestDataFactory.createTopicGroup("test", {
          id: "tg1",
          name: "To Do",
          order: 0,
        }),
        TestDataFactory.createTopicGroup("test", {
          id: "tg2",
          name: "Done",
          order: 1,
        }),
      ];

      const blocks = [
        TestDataFactory.createBlock("textblock", {
          topicGroupId: "tg1",
          text: "Note in To Do",
        }),
        TestDataFactory.createBlock("todoblock", {
          topicGroupId: "tg2",
          todo: "Task in Done",
          completed: true,
        }),
      ];

      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "Organized Meeting",
        blocks,
        topicGroups,
      });

      const result = await transformer.transform({
        meeting,
        options: { format: "markdown", filename: "test.md" },
      });

      const content = result.content;
      const toDoPart = content.substring(content.indexOf("## To Do"));
      const donePart = content.substring(content.indexOf("## Done"));

      expect(toDoPart).toContain("**[NOTE]**\nNote in To Do");
      expect(donePart).toContain("**[TODO]**\n- [x] Task in Done");
    });

    it("should include block creation timestamps", async () => {
      const transformer = new MarkdownTransformer();
      const block = TestDataFactory.createBlock("textblock", {
        text: "Test block",
        created_at: "2024-01-15T14:30:00.000Z",
      });

      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "Timestamp Meeting",
        date: "2024-01-15",
        startTime: "10:00",
        endTime: "11:00",
        blocks: [block],
        created_at: "2024-01-15T10:00:00.000Z",
        updated_at: "2024-01-15T11:00:00.000Z",
      });

      const result = await transformer.transform({
        meeting,
        options: { format: "markdown", filename: "test.md" },
      });

      expect(result.content).toContain("*Created: January 15, 2024");
    });

    it("should use localized block labels when translation function provided", async () => {
      const transformer = new MarkdownTransformer();

      // Mock German translation function
      const mockGermanTranslations: Record<string, string> = {
        "blocks.types.textblock": "Notiz",
        "blocks.types.todoblock": "Aufgabe",
        "blocks.types.qandablock": "F&A",
        "blocks.types.researchblock": "Recherche",
        "blocks.types.factblock": "Fakt",
        "blocks.types.decisionblock": "Entscheidung",
        "blocks.types.issueblock": "Problem",
        "blocks.types.goalblock": "Ziel",
        "blocks.types.followupblock": "Nachverfolgung",
        "blocks.types.ideablock": "Idee",
        "blocks.types.referenceblock": "Referenz",
      };

      const mockT = (key: string) => mockGermanTranslations[key] || key;

      const blocks = [
        TestDataFactory.createBlock("textblock", {
          text: "Das ist eine Notiz",
        }),
        TestDataFactory.createBlock("todoblock", {
          todo: "Aufgabe erledigen",
          completed: false,
        }),
        TestDataFactory.createBlock("qandablock", {
          question: "Was ist das?",
          answer: "Das ist eine Antwort",
        }),
      ];

      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "Deutsche Besprechung",
        blocks,
      });

      const result = await transformer.transform({
        meeting,
        options: {
          format: "markdown",
          filename: "test.md",
          t: mockT,
          language: "de",
        },
      });

      // Should use German block labels
      expect(result.content).toContain("**[NOTIZ]**");
      expect(result.content).toContain("**[AUFGABE]**");
      expect(result.content).toContain("**[F&A]**");

      // Should not contain English labels
      expect(result.content).not.toContain("**[NOTE]**");
      expect(result.content).not.toContain("**[TODO]**");
      expect(result.content).not.toContain("**[Q&A]**");
    });

    it("should fallback to English labels when no translation function provided", async () => {
      const transformer = new MarkdownTransformer();
      const block = TestDataFactory.createBlock("textblock", {
        text: "This is a note",
      });

      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "English Meeting",
        blocks: [block],
      });

      const result = await transformer.transform({
        meeting,
        options: { format: "markdown", filename: "test.md" }, // No translation function
      });

      // Should use English labels (default)
      expect(result.content).toContain("**[NOTE]**");
      expect(result.content).not.toContain("**[NOTIZ]**");
    });

    it("should explicitly use English labels when language is 'en'", async () => {
      const transformer = new MarkdownTransformer();

      // Mock English translation function
      const mockEnglishTranslations: Record<string, string> = {
        "blocks.types.textblock": "Note",
        "blocks.types.todoblock": "TODO",
        "blocks.types.decisionblock": "Decision",
      };

      const mockT = (key: string) => mockEnglishTranslations[key] || key;

      const blocks = [
        TestDataFactory.createBlock("textblock", {
          text: "This is a note",
        }),
        TestDataFactory.createBlock("todoblock", {
          todo: "Complete the task",
          completed: false,
        }),
        TestDataFactory.createBlock("decisionblock", {
          decision: "We decided to use React",
        }),
      ];

      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "English Meeting",
        blocks,
      });

      const result = await transformer.transform({
        meeting,
        options: {
          format: "markdown",
          filename: "test.md",
          t: mockT,
          language: "en",
        },
      });

      // Should use English block labels
      expect(result.content).toContain("**[NOTE]**");
      expect(result.content).toContain("**[TODO]**");
      expect(result.content).toContain("**[DECISION]**");

      // Should not contain German labels
      expect(result.content).not.toContain("**[NOTIZ]**");
      expect(result.content).not.toContain("**[AUFGABE]**");
      expect(result.content).not.toContain("**[ENTSCHEIDUNG]**");
    });

    it("should translate field labels for Q&A and Research blocks", async () => {
      const transformer = new MarkdownTransformer();

      // Mock German translations for field labels
      const mockGermanTranslations: Record<string, string> = {
        "blocks.types.qandablock": "F&A",
        "blocks.types.researchblock": "Recherche",
        "blocks.fields.question": "Frage",
        "blocks.fields.answer": "Antwort",
        "blocks.fields.topic": "Thema",
        "blocks.fields.result": "Ergebnis",
      };

      const mockT = (key: string) => mockGermanTranslations[key] || key;

      const blocks = [
        TestDataFactory.createBlock("qandablock", {
          question: "Was ist das?",
          answer: "Das ist ein Test",
        }),
        TestDataFactory.createBlock("researchblock", {
          topic: "AI Forschung",
          result: "Sehr interessant",
        }),
      ];

      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "German Field Test",
        blocks,
      });

      const result = await transformer.transform({
        meeting,
        options: {
          format: "markdown",
          filename: "test.md",
          t: mockT,
          language: "de",
        },
      });

      // Check that German field labels are used
      expect(result.content).toContain("**[F&A]**");
      expect(result.content).toContain("Frage: Was ist das?");
      expect(result.content).toContain("Antwort: Das ist ein Test");
      expect(result.content).toContain("**[RECHERCHE]**");
      expect(result.content).toContain("Thema: AI Forschung");
      expect(result.content).toContain("Ergebnis: Sehr interessant");
    });

    it("should include attendees in exported content", async () => {
      const transformer = new MarkdownTransformer();

      // Create test attendees
      const attendees = [
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

      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "Meeting with Attendees",
      });
      // Assign the attendees to the meeting
      meeting.attendeeIds = attendees.map((a) => a.id);

      const result = await transformer.transform({
        meeting,
        options: {
          format: "markdown",
          filename: "test.md",
          attendees,
        },
      });

      // Check that attendees section with count is included
      expect(result.content).toContain("## Attendees (3)");
      expect(result.content).toContain("- Alice Johnson (alice@example.com)");
      expect(result.content).toContain("- Bob Smith (bob@example.com)");
      expect(result.content).toContain("- Charlie Brown");
    });

    it("should not include attendees section when no attendees provided", async () => {
      const transformer = new MarkdownTransformer();

      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "Meeting without Attendees",
      });

      const result = await transformer.transform({
        meeting,
        options: {
          format: "markdown",
          filename: "test.md",
          // No attendees provided
        },
      });

      // Check that attendees section is not included
      expect(result.content).not.toContain("## Attendees");
    });

    it("should use localized attendees label", async () => {
      const transformer = new MarkdownTransformer();

      // Mock German translation
      const mockT = (key: string) => {
        if (key === "importExport.content.attendeesWithCount") {
          return "Teilnehmer ({{count}})";
        }
        return key;
      };

      const attendees = [
        TestDataFactory.createAttendee({
          name: "Alice Schmidt",
          email: "alice@example.de",
        }),
      ];

      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "Deutsche Besprechung",
      });
      // Assign the attendees to the meeting
      meeting.attendeeIds = attendees.map((a) => a.id);

      const result = await transformer.transform({
        meeting,
        options: {
          format: "markdown",
          filename: "test.md",
          t: mockT,
          language: "de",
          attendees,
        },
      });

      // Check that German attendees label with count is used
      expect(result.content).toContain("## Teilnehmer (1)");
      expect(result.content).toContain("- Alice Schmidt (alice@example.de)");
    });

    it("should preserve line breaks with smart markdown formatting", async () => {
      const transformer = new MarkdownTransformer();

      const textBlock = TestDataFactory.createBlock("textblock", {
        text: "First line\nSecond line\n\nFourth line (after empty line)",
      });

      const qandaBlock = TestDataFactory.createBlock("qandablock", {
        question: "What is this?\nA multi-line question",
        answer: "This is an answer\nWith multiple lines",
      });

      const todoBlock = TestDataFactory.createBlock("todoblock", {
        todo: "Complete task\nWith multiple steps",
        completed: false,
      });

      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "Line Break Test",
        blocks: [textBlock, qandaBlock, todoBlock],
      });

      const result = await transformer.transform({
        meeting,
        options: {
          format: "markdown",
          filename: "test.md",
        },
      });

      // Check that single \n becomes two spaces + \n (hard line break)
      // and double \n\n remains unchanged (paragraph break)
      expect(result.content).toContain(
        "First line  \nSecond line\n\nFourth line (after empty line)",
      );
      expect(result.content).toContain(
        "What is this?  \nA multi-line question",
      );
      expect(result.content).toContain(
        "This is an answer  \nWith multiple lines",
      );
      expect(result.content).toContain("Complete task  \nWith multiple steps");
    });
  });

  describe("HTMLTransformer", () => {
    it("should transform meeting to HTML", async () => {
      const transformer = new HTMLTransformer();

      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "HTML Test Meeting",
      });

      const result = await transformer.transform({
        meeting,
        options: {
          format: "html",
          filename: "test.html",
        },
      });

      expect(result.content).toContain("<!DOCTYPE html>");
      expect(result.content).toContain("HTML Test Meeting");
      expect(result.content).toContain('class="metadata"');
      expect(result.filename).toBe("test.html");
      expect(result.mimeType).toBe("text/html");
    });

    it("should include attendees in HTML export", async () => {
      const transformer = new HTMLTransformer();

      const attendees = [
        TestDataFactory.createAttendee({
          name: "John Doe",
          email: "john@example.com",
        }),
      ];

      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "Meeting with Attendees",
      });
      meeting.attendeeIds = attendees.map((a) => a.id);

      const result = await transformer.transform({
        meeting,
        options: {
          format: "html",
          filename: "test.html",
          attendees,
        },
      });

      expect(result.content).toContain("<h2>Attendees (1)</h2>");
      expect(result.content).toContain("John Doe (john@example.com)");
    });

    it("should ensure .html extension", async () => {
      const transformer = new HTMLTransformer();

      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "Test Meeting",
      });

      const result = await transformer.transform({
        meeting,
        options: {
          format: "html",
          filename: "test.md", // Wrong extension
        },
      });

      expect(result.filename).toBe("test.html");
    });

    it("should preserve line breaks in HTML content", async () => {
      const transformer = new HTMLTransformer();

      const textBlock = TestDataFactory.createBlock("textblock", {
        text: "First line\nSecond line\n\nFourth line (after empty line)",
      });

      const qandaBlock = TestDataFactory.createBlock("qandablock", {
        question: "What is this?\nA multi-line question",
        answer: "This is an answer\nWith multiple lines",
      });

      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "Line Break Test",
        blocks: [textBlock, qandaBlock],
      });

      const result = await transformer.transform({
        meeting,
        options: {
          format: "html",
          filename: "test.html",
        },
      });

      // Check that line breaks are converted to <br> tags
      expect(result.content).toContain(
        "First line<br>Second line<br><br>Fourth line (after empty line)",
      );
      expect(result.content).toContain(
        "What is this?<br>A multi-line question",
      );
      expect(result.content).toContain(
        "This is an answer<br>With multiple lines",
      );
    });
  });

  describe("DOCXTransformer", () => {
    it("should transform meeting to DOCX without errors", async () => {
      const transformer = new DOCXTransformer();

      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "DOCX Test Meeting",
      });

      const result = await transformer.transform({
        meeting,
        options: {
          format: "docx",
          filename: "test.docx",
        },
      });

      expect(result.content).toBeTruthy(); // Should generate content
      expect(result.filename).toBe("test.docx");
      expect(result.mimeType).toBe(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
    });

    it("should handle multi-line text in DOCX export without errors", async () => {
      const transformer = new DOCXTransformer();

      const textBlock = TestDataFactory.createBlock("textblock", {
        text: "First line\nSecond line\n\nFourth line (after empty line)",
      });

      const qandaBlock = TestDataFactory.createBlock("qandablock", {
        question: "What is this?\nA multi-line question",
        answer: "This is an answer\nWith multiple lines",
      });

      const todoBlock = TestDataFactory.createBlock("todoblock", {
        todo: "Complete task\nWith multiple steps",
        completed: false,
      });

      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "Multi-line DOCX Test",
        blocks: [textBlock, qandaBlock, todoBlock],
      });

      // This should not throw an error
      const result = await transformer.transform({
        meeting,
        options: {
          format: "docx",
          filename: "test.docx",
        },
      });

      expect(result.content).toBeTruthy();
      expect(result.filename).toBe("test.docx");
    });

    it("should ensure .docx extension", async () => {
      const transformer = new DOCXTransformer();

      const meeting = TestDataFactory.createMeeting({
        id: "test",
        title: "Test Meeting",
      });

      const result = await transformer.transform({
        meeting,
        options: {
          format: "docx",
          filename: "test.txt", // Wrong extension
        },
      });

      expect(result.filename).toBe("test.docx");
    });
  });

  describe("Error Scenarios", () => {
    it("should handle export with invalid meeting data", async () => {
      const exporter = new BaseExporter();
      const invalidMeeting = {
        ...TestDataFactory.createMeeting(),
        blocks: null, // Invalid blocks
      };

      await expect(
        exporter.export(invalidMeeting as any, {
          format: "markdown",
          filename: "test.md",
        }),
      ).rejects.toThrow();
    });

    it("should handle export with corrupted block data gracefully", async () => {
      const exporter = new BaseExporter();
      const meeting = TestDataFactory.createMeeting();
      meeting.blocks = [
        {
          id: "corrupted-block",
          type: "textblock",
          // Missing required fields like created_at
        } as any,
      ];

      // Should handle gracefully rather than throw
      const result = await exporter.export(meeting, {
        format: "markdown",
        filename: "test.md",
      });
      expect(result.content).toBeTruthy();
    });

    it("should handle export with unsupported format", async () => {
      const exporter = new BaseExporter();
      const meeting = TestDataFactory.createMeeting();

      await expect(
        exporter.export(meeting, {
          format: "unsupported" as any,
          filename: "test.unsupported",
        }),
      ).rejects.toThrow("Unsupported export format: unsupported");
    });

    it("should handle export with empty filename gracefully", async () => {
      const exporter = new BaseExporter();
      const meeting = TestDataFactory.createMeeting();

      // Should handle gracefully with empty filename
      const result = await exporter.export(meeting, {
        format: "markdown",
        filename: "",
      });
      expect(result.content).toBeTruthy();
      expect(result.filename).toBe(""); // Preserves provided filename
    });

    it("should handle export with invalid attendee references", async () => {
      const exporter = new BaseExporter();
      const meeting = TestDataFactory.createMeeting({
        attendeeIds: ["non-existent-id"],
      });
      const attendees = [TestDataFactory.createAttendee()];

      // Should not throw but should handle gracefully
      const result = await exporter.export(meeting, {
        format: "markdown",
        filename: "test.md",
        attendees,
      });

      expect(result.content).toBeTruthy();
      expect(result.content).not.toContain("non-existent-id");
    });

    it("should handle export with circular references gracefully", async () => {
      const exporter = new BaseExporter();
      const meeting = TestDataFactory.createMeeting();
      const block = TestDataFactory.createBlock("textblock");

      // Create circular reference
      (block as any).circular = block;
      meeting.blocks = [block];

      // Should handle gracefully without throwing
      const result = await exporter.export(meeting, {
        format: "markdown",
        filename: "test.md",
      });
      expect(result.content).toBeTruthy();
    });

    it("should handle export with extremely large data", async () => {
      const exporter = new BaseExporter();
      const meeting = TestDataFactory.createMeeting();
      const largeText = "x".repeat(1000000); // 1MB of text

      meeting.blocks = [
        TestDataFactory.createBlock("textblock", { text: largeText }),
      ];

      const result = await exporter.export(meeting, {
        format: "markdown",
        filename: "large-test.md",
      });

      expect(result.content).toContain(largeText);
      expect(result.content.length).toBeGreaterThan(1000000);
    });

    it("should handle transformer errors gracefully", async () => {
      const exporter = new BaseExporter();
      const meeting = TestDataFactory.createMeeting();

      // Mock the transformer to throw an error
      const originalTransform = MarkdownTransformer.prototype.transform;
      MarkdownTransformer.prototype.transform = vi.fn(async () => {
        throw new Error("Transformer error");
      }) as any;

      await expect(
        exporter.export(meeting, {
          format: "markdown",
          filename: "test.md",
        }),
      ).rejects.toThrow("Transformer error");

      // Restore original method
      MarkdownTransformer.prototype.transform = originalTransform;
    });

    it("should handle malformed topic groups", async () => {
      const exporter = new BaseExporter();
      const meeting = TestDataFactory.createMeeting();

      // Add malformed topic group
      meeting.topicGroups = [
        {
          id: "malformed",
          // Missing required fields
        } as any,
      ];

      await expect(
        exporter.export(meeting, {
          format: "markdown",
          filename: "test.md",
        }),
      ).rejects.toThrow();
    });

    // Note: Null/undefined data testing consolidated with invalid data tests

    it("should handle invalid block types gracefully", async () => {
      const exporter = new BaseExporter();
      const meeting = TestDataFactory.createMeeting();

      meeting.blocks = [
        {
          id: "invalid-block",
          type: "invalidtype" as any,
          created_at: new Date().toISOString(),
          topicGroupId: "default",
          sortKey: "a0",
        },
      ];

      // Should handle gracefully
      const result = await exporter.export(meeting, {
        format: "markdown",
        filename: "test.md",
      });
      expect(result.content).toBeTruthy();
      expect(result.content).toContain("[INVALIDTYPE]"); // Shows it handles invalid types
    });

    it("should handle network/file system errors during export", async () => {
      const exporter = new BaseExporter();
      const meeting = TestDataFactory.createMeeting();

      // Mock Blob constructor to throw error
      const originalBlob = global.Blob;
      global.Blob = vi.fn(function () {
        throw new Error("File system error");
      }) as any;

      await expect(
        exporter.export(meeting, {
          format: "docx",
          filename: "test.docx",
        }),
      ).rejects.toThrow(); // Accept any error from mocked Blob

      // Restore original Blob
      global.Blob = originalBlob;
    });

    it("should handle memory pressure during large exports", async () => {
      const exporter = new BaseExporter();
      const meeting = TestDataFactory.createMeeting();

      // Create a very large meeting with many blocks
      const largeBlocks = Array.from(
        { length: 10000 },
        (_, i) =>
          TestDataFactory.createBlock("textblock", {
            text: `Large block content ${i} `.repeat(1000),
          }),
      );

      meeting.blocks = largeBlocks;

      // This should either succeed or throw a memory-related error
      try {
        const result = await exporter.export(meeting, {
          format: "markdown",
          filename: "huge-test.md",
        });

        expect(result.content).toBeTruthy();
        expect(result.content.length).toBeGreaterThan(1000000);
      } catch (error) {
        // Accept memory-related errors as expected behavior
        expect(error.message).toMatch(/memory|size|limit/i);
      }
    });

    it("should handle concurrent export operations", async () => {
      const exporter = new BaseExporter();
      const meeting = TestDataFactory.createMeeting();

      // Start multiple export operations concurrently
      const exportPromises = Array.from(
        { length: 5 },
        (_, i) =>
          exporter.export(meeting, {
            format: "markdown",
            filename: `concurrent-test-${i}.md`,
          }),
      );

      // All should complete successfully
      const results = await Promise.all(exportPromises);

      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.content).toBeTruthy();
        expect(result.filename).toBe(`concurrent-test-${i}.md`);
      });
    });
  });
});
