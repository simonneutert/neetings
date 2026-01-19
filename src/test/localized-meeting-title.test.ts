import { describe, expect, it } from "vitest";
import { createEmptyMeeting } from "../types/Meeting";
import { generateUUID } from "../utils/uuid";

describe("Localized Meeting and Series Titles", () => {
  describe("Meeting Titles", () => {
    it("should create meeting with default title when no title provided", () => {
      const meeting = createEmptyMeeting(generateUUID());
      expect(meeting.title).toBe("Untitled Meeting");
    });

    it("should create meeting with custom title when title provided", () => {
      const customTitle = "Unbenannte Besprechung"; // German translation
      const meeting = createEmptyMeeting(generateUUID(), customTitle);
      expect(meeting.title).toBe(customTitle);
    });

    it("should create meeting with English title", () => {
      const englishTitle = "Untitled Meeting";
      const meeting = createEmptyMeeting(generateUUID(), englishTitle);
      expect(meeting.title).toBe(englishTitle);
    });

    it("should create meeting with German title", () => {
      const germanTitle = "Unbenannte Besprechung";
      const meeting = createEmptyMeeting(generateUUID(), germanTitle);
      expect(meeting.title).toBe(germanTitle);
    });

    it("should have all required meeting properties when custom title provided", () => {
      const customTitle = "Test Meeting";
      const meeting = createEmptyMeeting(generateUUID(), customTitle);

      expect(meeting).toHaveProperty("id");
      expect(meeting).toHaveProperty("title", customTitle);
      expect(meeting).toHaveProperty("date");
      expect(meeting).toHaveProperty("startTime", "");
      expect(meeting).toHaveProperty("endTime", "");
      expect(meeting).toHaveProperty("blocks", []);
      expect(meeting).toHaveProperty("topicGroups", []);
      expect(meeting).toHaveProperty("attendeeIds", []);
      expect(meeting).toHaveProperty("created_at");
      expect(meeting).toHaveProperty("updated_at");
    });
  });

  describe("Series Default Titles", () => {
    it("should have English default series title in translation", () => {
      const enTranslations = require("../i18n/locales/en.json");
      expect(enTranslations.meeting.series.defaultTitle).toBe(
        "New Meeting Series",
      );
    });

    it("should have German default series title in translation", () => {
      const deTranslations = require("../i18n/locales/de.json");
      expect(deTranslations.meeting.series.defaultTitle).toBe(
        "Neue Besprechungsreihe",
      );
    });

    it("should have English untitled meeting title in translation", () => {
      const enTranslations = require("../i18n/locales/en.json");
      expect(enTranslations.meeting.untitled).toBe("Untitled Meeting");
    });

    it("should have German untitled meeting title in translation", () => {
      const deTranslations = require("../i18n/locales/de.json");
      expect(deTranslations.meeting.untitled).toBe("Unbenannte Besprechung");
    });
  });
});
