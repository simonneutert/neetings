import { describe, expect, it } from "vitest";
import {
  createDefaultSeries,
  CreateSeriesSchema,
  MeetingSeriesSchema,
  MeetingSeriesType,
  migrateLegacyMeetingsToSeries,
  parseMeetingSeries,
  parseMeetingSeriesSafe,
  updateSeriesData,
  UpdateSeriesSchema,
  validateMeetingSeries,
  validateSeriesIntegrity,
} from "../schemas/meetingSeries";
import { Meeting } from "../types/Meeting";
import { APP_CONFIG } from "../constants";

// Helper to create a valid meeting
const createTestMeeting = (id: string = "test-1"): Meeting => ({
  id,
  title: "Test Meeting",
  date: "2024-01-15",
  startTime: "10:00",
  endTime: "11:00",
  blocks: [],
  topicGroups: [],
  attendeeIds: [],
  created_at: "2024-01-15T10:00:00.000Z",
  updated_at: "2024-01-15T10:00:00.000Z",
});

// Helper to create a valid series
const createTestSeries = (
  title: string = "Test Series",
  agenda: string = "Test agenda",
): MeetingSeriesType => ({
  title,
  agenda,
  meetings: [createTestMeeting()],
  created_at: "2024-01-15T10:00:00.000Z",
  updated_at: "2024-01-15T10:00:00.000Z",
});

describe("MeetingSeriesSchema", () => {
  describe("Basic validation", () => {
    it("should validate a valid series", () => {
      const series = createTestSeries();
      expect(() => MeetingSeriesSchema.parse(series)).not.toThrow();
    });

    it("should require a title", () => {
      const series = createTestSeries();
      delete (series as any).title;
      expect(() => MeetingSeriesSchema.parse(series)).toThrow();
    });

    it("should trim and validate title", () => {
      const series = createTestSeries("  Test Series  ");
      const parsed = MeetingSeriesSchema.parse(series);
      expect(parsed.title).toBe("Test Series");
    });

    it("should require non-empty title", () => {
      const series = createTestSeries("");
      expect(() => MeetingSeriesSchema.parse(series)).toThrow(
        "Series title is required",
      );
    });

    it("should enforce title character limit", () => {
      const longTitle = "a".repeat(APP_CONFIG.SERIES.TITLE_MAX_LENGTH + 1);
      const series = createTestSeries(longTitle);
      expect(() => MeetingSeriesSchema.parse(series)).toThrow(
        "Series title must not exceed 280 characters",
      );
    });

    it("should allow empty agenda", () => {
      const series = createTestSeries("Test", "");
      expect(() => MeetingSeriesSchema.parse(series)).not.toThrow();
    });

    it("should enforce agenda character limit", () => {
      const longAgenda = "a".repeat(APP_CONFIG.SERIES.AGENDA_MAX_LENGTH + 1);
      const series = createTestSeries("Test", longAgenda);
      expect(() => MeetingSeriesSchema.parse(series)).toThrow(
        "Series agenda must not exceed 600 characters",
      );
    });

    it("should require valid datetime strings", () => {
      const series = createTestSeries();
      series.created_at = "invalid-date";
      expect(() => MeetingSeriesSchema.parse(series)).toThrow();
    });

    it("should require meetings array", () => {
      const series = createTestSeries();
      delete (series as any).meetings;
      expect(() => MeetingSeriesSchema.parse(series)).toThrow();
    });
  });

  describe("CreateSeriesSchema", () => {
    it("should create series with defaults", () => {
      const parsed = CreateSeriesSchema.parse({});
      expect(parsed.title).toBe(APP_CONFIG.DEFAULT_VALUES.SERIES_TITLE);
      expect(parsed.agenda).toBe(APP_CONFIG.DEFAULT_VALUES.SERIES_AGENDA);
      expect(parsed.meetings).toEqual([]);
    });

    it("should allow custom title and agenda", () => {
      const parsed = CreateSeriesSchema.parse({
        title: "Custom Title",
        agenda: "Custom agenda",
      });
      expect(parsed.title).toBe("Custom Title");
      expect(parsed.agenda).toBe("Custom agenda");
    });

    it("should trim title", () => {
      const parsed = CreateSeriesSchema.parse({
        title: "  Trimmed Title  ",
      });
      expect(parsed.title).toBe("Trimmed Title");
    });
  });

  describe("UpdateSeriesSchema", () => {
    it("should allow partial updates", () => {
      const update = { title: "Updated Title" };
      expect(() => UpdateSeriesSchema.parse(update)).not.toThrow();
    });

    it("should validate title if provided", () => {
      const update = { title: "" };
      expect(() => UpdateSeriesSchema.parse(update)).toThrow();
    });

    it("should validate agenda length if provided", () => {
      const longAgenda = "a".repeat(APP_CONFIG.SERIES.AGENDA_MAX_LENGTH + 1);
      const update = { agenda: longAgenda };
      expect(() => UpdateSeriesSchema.parse(update)).toThrow();
    });
  });

  describe("Validation utilities", () => {
    it("validateMeetingSeries should return boolean", () => {
      const validSeries = createTestSeries();
      const invalidSeries = { title: "" };

      expect(validateMeetingSeries(validSeries)).toBe(true);
      expect(validateMeetingSeries(invalidSeries)).toBe(false);
    });

    it("parseMeetingSeries should parse valid data", () => {
      const series = createTestSeries();
      const parsed = parseMeetingSeries(series);
      expect(parsed.title).toBe(series.title);
    });

    it("parseMeetingSeries should throw on invalid data", () => {
      const invalidSeries = { title: "" };
      expect(() => parseMeetingSeries(invalidSeries)).toThrow();
    });

    it("parseMeetingSeriesSafe should return success for valid data", () => {
      const series = createTestSeries();
      const result = parseMeetingSeriesSafe(series);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe(series.title);
      }
    });

    it("parseMeetingSeriesSafe should return error for invalid data", () => {
      const invalidSeries = { title: "" };
      const result = parseMeetingSeriesSafe(invalidSeries);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe("validateSeriesIntegrity", () => {
    it("should return valid for good data", () => {
      const series = createTestSeries();
      const result = validateSeriesIntegrity(series);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should return errors for invalid data", () => {
      const invalidSeries = { title: "", agenda: "a".repeat(700) };
      const result = validateSeriesIntegrity(invalidSeries);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("migrateLegacyMeetingsToSeries", () => {
    it("should convert meetings array to series", () => {
      const meetings = [createTestMeeting("1"), createTestMeeting("2")];
      const series = migrateLegacyMeetingsToSeries(meetings);

      expect(series.title).toBe("New Meeting Series");
      expect(series.agenda).toBe("");
      expect(series.meetings).toEqual(meetings);
      expect(series.created_at).toBeDefined();
      expect(series.updated_at).toBeDefined();
    });

    it("should handle empty meetings array", () => {
      const series = migrateLegacyMeetingsToSeries([]);

      expect(series.title).toBe("New Meeting Series");
      expect(series.agenda).toBe("");
      expect(series.meetings).toEqual([]);
    });

    it("should pass through valid series object", () => {
      const existingSeries = createTestSeries();
      const result = migrateLegacyMeetingsToSeries(existingSeries);

      expect(result.title).toBe(existingSeries.title);
      expect(result.agenda).toBe(existingSeries.agenda);
      expect(result.meetings).toEqual(existingSeries.meetings);
    });

    it("should throw for invalid data", () => {
      expect(() => migrateLegacyMeetingsToSeries("invalid")).toThrow(
        "Invalid data format: expected meetings array or series object",
      );
      expect(() => migrateLegacyMeetingsToSeries(123)).toThrow();
      expect(() => migrateLegacyMeetingsToSeries(null)).toThrow();
    });
  });

  describe("createDefaultSeries", () => {
    it("should create a valid default series", () => {
      const series = createDefaultSeries();

      expect(series.title).toBe(APP_CONFIG.DEFAULT_VALUES.SERIES_TITLE);
      expect(series.agenda).toBe(APP_CONFIG.DEFAULT_VALUES.SERIES_AGENDA);
      expect(series.meetings).toEqual([]);
      expect(series.created_at).toBeDefined();
      expect(series.updated_at).toBeDefined();
      expect(new Date(series.created_at)).toBeInstanceOf(Date);
      expect(new Date(series.updated_at)).toBeInstanceOf(Date);
    });
  });

  describe("updateSeriesData", () => {
    it("should update title", () => {
      const series = createTestSeries();
      const updated = updateSeriesData(series, { title: "New Title" });

      expect(updated.title).toBe("New Title");
      expect(updated.agenda).toBe(series.agenda);
      expect(updated.meetings).toEqual(series.meetings);
      expect(updated.updated_at).not.toBe(series.updated_at);
    });

    it("should update agenda", () => {
      const series = createTestSeries();
      const updated = updateSeriesData(series, { agenda: "New agenda" });

      expect(updated.title).toBe(series.title);
      expect(updated.agenda).toBe("New agenda");
      expect(updated.meetings).toEqual(series.meetings);
      expect(updated.updated_at).not.toBe(series.updated_at);
    });

    it("should update both title and agenda", () => {
      const series = createTestSeries();
      const updated = updateSeriesData(series, {
        title: "New Title",
        agenda: "New agenda",
      });

      expect(updated.title).toBe("New Title");
      expect(updated.agenda).toBe("New agenda");
      expect(updated.meetings).toEqual(series.meetings);
      expect(updated.updated_at).not.toBe(series.updated_at);
    });

    it("should validate updates", () => {
      const series = createTestSeries();

      expect(() => updateSeriesData(series, { title: "" })).toThrow();

      const longAgenda = "a".repeat(APP_CONFIG.SERIES.AGENDA_MAX_LENGTH + 1);
      expect(() => updateSeriesData(series, { agenda: longAgenda })).toThrow();
    });

    it("should preserve other fields", () => {
      const series = createTestSeries();
      const originalCreatedAt = series.created_at;

      const updated = updateSeriesData(series, { title: "New Title" });

      expect(updated.created_at).toBe(originalCreatedAt);
      expect(updated.meetings).toEqual(series.meetings);
    });
  });

  describe("Character limits from constants", () => {
    it("should respect title character limit from constants", () => {
      const title = "a".repeat(APP_CONFIG.SERIES.TITLE_MAX_LENGTH);
      const series = createTestSeries(title);
      expect(() => MeetingSeriesSchema.parse(series)).not.toThrow();

      const tooLongTitle = "a".repeat(APP_CONFIG.SERIES.TITLE_MAX_LENGTH + 1);
      const invalidSeries = createTestSeries(tooLongTitle);
      expect(() => MeetingSeriesSchema.parse(invalidSeries)).toThrow();
    });

    it("should respect agenda character limit from constants", () => {
      const agenda = "a".repeat(APP_CONFIG.SERIES.AGENDA_MAX_LENGTH);
      const series = createTestSeries("Test", agenda);
      expect(() => MeetingSeriesSchema.parse(series)).not.toThrow();

      const tooLongAgenda = "a".repeat(APP_CONFIG.SERIES.AGENDA_MAX_LENGTH + 1);
      const invalidSeries = createTestSeries("Test", tooLongAgenda);
      expect(() => MeetingSeriesSchema.parse(invalidSeries)).toThrow();
    });
  });
});
