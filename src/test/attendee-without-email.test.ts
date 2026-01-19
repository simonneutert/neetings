import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAttendee, validateAttendee } from "../types/Attendee";
import { AttendeeSchema } from "../schemas/attendee";

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
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
  value: mockLocalStorage,
});

describe("Attendee Without Email Support", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe("Attendee Creation", () => {
    it("should create attendee with name only", () => {
      const attendee = createAttendee("John Doe");

      expect(attendee.name).toBe("John Doe");
      expect(attendee.email).toBeUndefined();
      expect(attendee.id).toBeTruthy();
      expect(attendee.created_at).toBeTruthy();
      expect(attendee.updated_at).toBeTruthy();
    });

    it("should create attendee with name and email", () => {
      const attendee = createAttendee("Jane Smith", "jane@example.com");

      expect(attendee.name).toBe("Jane Smith");
      expect(attendee.email).toBe("jane@example.com");
      expect(attendee.id).toBeTruthy();
    });

    it("should create attendee with empty string email", () => {
      const attendee = createAttendee("Bob Johnson", "");

      expect(attendee.name).toBe("Bob Johnson");
      expect(attendee.email).toBe("");
      expect(attendee.id).toBeTruthy();
    });
  });

  describe("Attendee Validation", () => {
    it("should validate attendee without email", () => {
      const attendee = createAttendee("Test User");
      const isValid = validateAttendee(attendee);

      expect(isValid).toBe(true);
    });

    it("should validate attendee with email", () => {
      const attendee = createAttendee("Test User", "test@example.com");
      const isValid = validateAttendee(attendee);

      expect(isValid).toBe(true);
    });

    it("should not validate attendee without required fields", () => {
      const invalidAttendee = {
        id: "",
        name: "",
        created_at: "",
        updated_at: "",
      };

      const isValid = validateAttendee(invalidAttendee as any);
      expect(isValid).toBe(false);
    });
  });

  describe("Attendee Schema Validation", () => {
    it("should pass schema validation without email", () => {
      const attendee = createAttendee("Schema Test");
      const result = AttendeeSchema.safeParse(attendee);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Schema Test");
        expect(result.data.email).toBeUndefined();
      }
    });

    it("should pass schema validation with email", () => {
      const attendee = createAttendee("Schema Test", "schema@test.com");
      const result = AttendeeSchema.safeParse(attendee);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Schema Test");
        expect(result.data.email).toBe("schema@test.com");
      }
    });

    it("should fail schema validation with invalid email", () => {
      const attendee = createAttendee("Invalid Email Test");
      attendee.email = "not-an-email";

      const result = AttendeeSchema.safeParse(attendee);
      expect(result.success).toBe(false);
    });

    it("should pass schema validation with empty string email", () => {
      const attendee = createAttendee("Empty Email Test", "");
      const result = AttendeeSchema.safeParse(attendee);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("");
      }
    });
  });

  describe("Search Functionality", () => {
    it("should search attendees by name when no email is present", () => {
      const attendees = [
        createAttendee("John Doe"),
        createAttendee("Jane Smith", "jane@example.com"),
        createAttendee("John Wilson"),
      ];

      const searchTerm = "john";
      const filtered = attendees.filter((attendee) =>
        attendee.name.toLowerCase().includes(searchTerm) ||
        (attendee.email && attendee.email.toLowerCase().includes(searchTerm))
      );

      expect(filtered).toHaveLength(2);
      expect(filtered[0].name).toBe("John Doe");
      expect(filtered[1].name).toBe("John Wilson");
    });

    it("should handle mixed search results with and without email", () => {
      const attendees = [
        createAttendee("John Doe"), // No email - matches name
        createAttendee("Jane Smith", "john@example.com"), // Email contains "john"
        createAttendee("Bob Johnson", "bob@test.com"), // Name contains "john"
      ];

      const searchTerm = "john";
      const filtered = attendees.filter((attendee) =>
        attendee.name.toLowerCase().includes(searchTerm) ||
        (attendee.email && attendee.email.toLowerCase().includes(searchTerm))
      );

      expect(filtered).toHaveLength(3); // All three should match
      expect(filtered.some((a) => a.name === "John Doe")).toBe(true);
      expect(filtered.some((a) => a.name === "Jane Smith")).toBe(true);
      expect(filtered.some((a) => a.name === "Bob Johnson")).toBe(true);
    });

    it("should not crash when searching attendees without email", () => {
      const attendees = [
        createAttendee("No Email User"),
        createAttendee("Another User"),
      ];

      expect(() => {
        attendees.filter((attendee) =>
          attendee.name.toLowerCase().includes("user") ||
          (attendee.email && attendee.email.toLowerCase().includes("user"))
        );
      }).not.toThrow();
    });
  });

  describe("Display Logic", () => {
    it("should handle display of attendee without email", () => {
      const attendee = createAttendee("Display Test");

      // Simulate how the UI would display the attendee
      const displayName = attendee.name;
      const displayEmail = attendee.email || "No email provided";

      expect(displayName).toBe("Display Test");
      expect(displayEmail).toBe("No email provided");
    });

    it("should handle display of attendee with email", () => {
      const attendee = createAttendee("Display Test", "display@test.com");

      const displayName = attendee.name;
      const displayEmail = attendee.email || "No email provided";

      expect(displayName).toBe("Display Test");
      expect(displayEmail).toBe("display@test.com");
    });
  });

  describe("Data Persistence", () => {
    it("should save and load attendees without email to localStorage", () => {
      const attendees = [
        createAttendee("Persistent User"),
        createAttendee("Email User", "email@test.com"),
      ];

      // Save to localStorage
      localStorage.setItem("attendees", JSON.stringify(attendees));

      // Load from localStorage
      const stored = localStorage.getItem("attendees");
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe("Persistent User");
      expect(parsed[0].email).toBeUndefined();
      expect(parsed[1].name).toBe("Email User");
      expect(parsed[1].email).toBe("email@test.com");
    });
  });

  describe("Meeting Integration", () => {
    it("should handle attendee assignment to meeting without email", () => {
      const attendee = createAttendee("Meeting Attendee");
      const meetingAttendeeIds = [attendee.id];

      expect(meetingAttendeeIds).toContain(attendee.id);
      expect(attendee.email).toBeUndefined();
    });

    it("should filter meeting attendees correctly", () => {
      const attendees = [
        createAttendee("Attendee 1"),
        createAttendee("Attendee 2", "attendee2@test.com"),
        createAttendee("Attendee 3"),
      ];

      const meetingAttendeeIds = [attendees[0].id, attendees[2].id]; // Include attendees without email
      const meetingAttendees = attendees.filter((a) =>
        meetingAttendeeIds.includes(a.id)
      );

      expect(meetingAttendees).toHaveLength(2);
      expect(meetingAttendees[0].name).toBe("Attendee 1");
      expect(meetingAttendees[0].email).toBeUndefined();
      expect(meetingAttendees[1].name).toBe("Attendee 3");
      expect(meetingAttendees[1].email).toBeUndefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined email gracefully", () => {
      const attendee = createAttendee("Edge Case Test");
      attendee.email = undefined;

      expect(() => validateAttendee(attendee)).not.toThrow();
      expect(validateAttendee(attendee)).toBe(true);
    });

    it("should handle null email gracefully", () => {
      const attendee = createAttendee("Null Email Test");
      (attendee as any).email = null;

      // This should be handled safely in search
      expect(() => {
        const searchResult = attendee.name.toLowerCase().includes("test") ||
          (attendee.email && attendee.email.toLowerCase().includes("test"));
        return searchResult;
      }).not.toThrow();
    });

    it("should handle empty attendee list", () => {
      const attendees: any[] = [];
      const filtered = attendees.filter((attendee) =>
        attendee.name.toLowerCase().includes("test") ||
        (attendee.email && attendee.email.toLowerCase().includes("test"))
      );

      expect(filtered).toHaveLength(0);
    });
  });
});
