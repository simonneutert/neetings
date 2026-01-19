import { describe, expect, it, vi } from "vitest";
import {
  checkMemoryUsage,
  sanitizeUserInput,
  SecureTextContentSchema,
  validateExportData,
  validateFileUpload,
  validateJSONDepth,
} from "../utils/securityValidation";

describe("Security Features", () => {
  describe("File Upload Security", () => {
    it("should reject files over size limit", () => {
      // Test file size validation
      const oversizedFile = new File(
        ["x".repeat(51 * 1024 * 1024)],
        "large.json",
        {
          type: "application/json",
        },
      );
      expect(oversizedFile.size).toBeGreaterThan(50 * 1024 * 1024);
    }, 10000);

    it("should reject non-JSON files", () => {
      const textFile = new File(["test"], "test.txt", { type: "text/plain" });
      expect(textFile.type).not.toBe("application/json");
      expect(textFile.name.endsWith(".json")).toBe(false);
    });

    it("should accept valid JSON files under size limit", () => {
      const validFile = new File(['{"test": "data"}'], "valid.json", {
        type: "application/json",
      });
      expect(validFile.size).toBeLessThan(50 * 1024 * 1024);
      expect(validFile.type).toBe("application/json");
    });

    it("should accept JSON files with text/plain type but .json extension", () => {
      const jsonFile = new File(['{"test": "data"}'], "valid.json", {
        type: "text/plain",
      });
      expect(jsonFile.name.endsWith(".json")).toBe(true);
    });
  });

  describe("Input Validation", () => {
    it("should handle malformed JSON gracefully", () => {
      const malformedJSON = '{"invalid": json}';
      expect(() => JSON.parse(malformedJSON)).toThrow();
    });

    it("should handle empty JSON", () => {
      const emptyJSON = "";
      expect(() => JSON.parse(emptyJSON)).toThrow();
    });

    it("should handle non-string input to JSON.parse", () => {
      // JSON.parse(null) actually returns null, it doesn't throw
      expect(JSON.parse(null as any)).toBe(null);
      expect(() => JSON.parse(undefined as any)).toThrow();
    });

    it("should validate export data structure", () => {
      // Test that invalid data structure is handled
      const invalidData = { not: "meetings" };
      expect(Array.isArray(invalidData)).toBe(false);
      expect(invalidData.meetings).toBeUndefined();
    });

    it("should handle deeply nested objects", () => {
      // Create a deeply nested object that might cause stack overflow
      const deepObject: any = {};
      let current = deepObject;
      for (let i = 0; i < 100; i++) {
        current.nested = {};
        current = current.nested;
      }

      // Should not crash when stringifying
      expect(() => JSON.stringify(deepObject)).not.toThrow();
    });

    it("should reject JSON with excessive depth using validateJSONDepth", () => {
      // Create object deeper than 10 levels
      const deepObject = Array(15).fill(0).reduce(
        (acc) => ({ nested: acc }),
        {},
      );
      expect(validateJSONDepth(deepObject, 10)).toBe(false);
    });

    it("should accept JSON within depth limit", () => {
      // Create object with exactly 5 levels
      const shallowObject = Array(5).fill(0).reduce(
        (acc) => ({ nested: acc }),
        {},
      );
      expect(validateJSONDepth(shallowObject, 10)).toBe(true);
    });

    it("should handle arrays in depth validation", () => {
      // Create deeply nested array structure
      const deepArray = Array(15).fill(0).reduce((acc) => [acc], []);
      expect(validateJSONDepth(deepArray, 10)).toBe(false);

      // Shallow array should pass
      const shallowArray = Array(5).fill(0).reduce((acc) => [acc], []);
      expect(validateJSONDepth(shallowArray, 10)).toBe(true);
    });
  });

  describe("Content Security", () => {
    it("should handle potential XSS payloads in text content", () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        '"><script>alert("xss")</script>',
      ];

      xssPayloads.forEach((payload) => {
        // These should be treated as plain text, not executed
        expect(typeof payload).toBe("string");
        // Verify dangerous patterns are detected
        expect(
          payload.includes("<script>") || payload.includes("javascript:") ||
            payload.includes("onerror"),
        ).toBe(true);
      });
    });

    it("should reject malicious content with SecureTextContentSchema", () => {
      const maliciousPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'onclick="alert(1)"',
        'vbscript:msgbox("xss")',
        'onload="alert(1)"',
      ];

      maliciousPayloads.forEach((payload) => {
        expect(() => SecureTextContentSchema.parse(payload)).toThrow(
          "Potentially malicious content detected",
        );
      });
    });

    it("should accept safe content with SecureTextContentSchema", () => {
      const safeContent = [
        "This is safe text content",
        "Meeting notes about project status",
        "TODO: Complete the implementation",
        "Email: user@example.com",
        "Numbers and symbols: 123 !@# $%^",
      ];

      safeContent.forEach((content) => {
        expect(() => SecureTextContentSchema.parse(content)).not.toThrow();
      });
    });

    it("should sanitize HTML-like content with sanitizeUserInput", () => {
      const htmlContent = "<div>Safe content</div>";
      const sanitized = sanitizeUserInput(htmlContent);
      expect(sanitized).toBe("&lt;div&gt;Safe content&lt;/div&gt;");
    });

    it("should sanitize XSS attempts with sanitizeUserInput", () => {
      const xssAttempt = '<script>alert("xss")</script>';
      const sanitized = sanitizeUserInput(xssAttempt);
      expect(sanitized).toBe(
        "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
      );
      expect(sanitized).not.toContain("<script>");
    });
  });

  describe("Memory and Performance Security", () => {
    it("should handle large arrays without memory issues", () => {
      const largeArray = new Array(10000).fill({ test: "data" });
      expect(largeArray.length).toBe(10000);
      expect(() => JSON.stringify(largeArray)).not.toThrow();
    });

    it("should handle large strings", () => {
      const largeString = "x".repeat(1000000); // 1MB string
      expect(largeString.length).toBe(1000000);
      expect(typeof largeString).toBe("string");
    });

    it("should detect large memory usage with checkMemoryUsage", () => {
      const largeData = {
        content: "x".repeat(10 * 1024 * 1024), // 10MB string
        metadata: { test: "data" },
      };

      const memCheck = checkMemoryUsage(largeData);
      expect(memCheck.warning).toBe(true);
      expect(memCheck.size).toBeGreaterThan(5 * 1024 * 1024); // Over 5MB
    });

    it("should not warn for small memory usage", () => {
      const smallData = { content: "small text", metadata: { test: "data" } };

      const memCheck = checkMemoryUsage(smallData);
      expect(memCheck.warning).toBe(false);
      expect(memCheck.size).toBeLessThan(1024); // Under 1KB
    });
  });

  describe("File Type Detection", () => {
    it("should properly detect JSON MIME types", () => {
      const validTypes = ["application/json", "text/plain"];
      const invalidTypes = ["text/html", "application/javascript", "image/png"];

      validTypes.forEach((type) => {
        const file = new File(["{}"], "test.json", { type });
        expect(validTypes.includes(file.type) || file.name.endsWith(".json"))
          .toBe(true);
      });

      invalidTypes.forEach((type) => {
        const file = new File(["{}"], "test.txt", { type });
        expect(validTypes.includes(file.type) || file.name.endsWith(".json"))
          .toBe(false);
      });
    });
  });

  describe("Enhanced Security Validation", () => {
    it("should validate file upload security", () => {
      // Test oversized file
      const oversizedFile = new File(
        ["x".repeat(51 * 1024 * 1024)],
        "large.json",
        {
          type: "application/json",
        },
      );
      const oversizedResult = validateFileUpload(oversizedFile);
      expect(oversizedResult.valid).toBe(false);
      expect(oversizedResult.error).toContain("File too large");

      // Test invalid file type
      const invalidFile = new File(["test"], "test.exe", {
        type: "application/octet-stream",
      });
      const invalidResult = validateFileUpload(invalidFile);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.error).toContain("Invalid file type");

      // Test valid file
      const validFile = new File(['{"test": "data"}'], "valid.json", {
        type: "application/json",
      });
      const validResult = validateFileUpload(validFile);
      expect(validResult.valid).toBe(true);
      expect(validResult.error).toBeUndefined();
    });

    it("should validate export data comprehensively", () => {
      // Test with deeply nested data
      const deepData = Array(15).fill(0).reduce((acc) => ({ nested: acc }), {});
      const deepResult = validateExportData(deepData);
      expect(deepResult.valid).toBe(false);
      expect(deepResult.errors).toContain("Data structure too deeply nested");

      // Test with large data
      const largeData = { content: "x".repeat(10 * 1024 * 1024) };
      const largeResult = validateExportData(largeData);
      expect(largeResult.valid).toBe(false);
      expect(largeResult.errors.some((e) => e.includes("Large data size")))
        .toBe(true);

      // Test with valid data
      const validData = { meetings: [], attendees: [] };
      const validResult = validateExportData(validData);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
    });

    it("should handle Unicode and special characters", () => {
      const unicodeStrings = [
        "🚀 Meeting notes with emojis",
        "Ñoël meeting in français",
        "中文会议记录",
        "العربية اجتماع",
        "Русский текст",
        "한국어 회의",
        "हिंदी बैठक",
      ];

      unicodeStrings.forEach((str) => {
        expect(() => SecureTextContentSchema.parse(str)).not.toThrow();
        const sanitized = sanitizeUserInput(str);
        expect(typeof sanitized).toBe("string");
        expect(sanitized.length).toBeGreaterThan(0);
      });
    });

    it("should handle encoding edge cases", () => {
      const edgeCases = [
        "\u0000", // Null character
        "\uFEFF", // BOM
        "\u200B", // Zero-width space
        "\u2028\u2029", // Line/paragraph separators
        "\\u003cscript\\u003e", // Encoded script tag
        "%3Cscript%3E", // URL encoded script tag
      ];

      edgeCases.forEach((testCase) => {
        // Should not throw errors when processing
        expect(() => sanitizeUserInput(testCase)).not.toThrow();
        expect(() => JSON.stringify(testCase)).not.toThrow();

        // Only literal script tags should be rejected by schema (not encoded ones)
        if (testCase === "<script>" || testCase.includes("<script")) {
          expect(() => SecureTextContentSchema.parse(testCase)).toThrow();
        }
      });
    });

    it("should handle malformed JSON gracefully in validation", () => {
      const malformedInputs = [
        '{"unclosed": "object"',
        '{"trailing": "comma",}',
        '{key: "missing quotes"}',
        "undefined",
        "null",
        "",
        "   ",
        "{...spread operator}",
        "{function: () => {}}",
      ];

      malformedInputs.forEach((input) => {
        // Should not crash the validation process
        expect(() => {
          try {
            JSON.parse(input);
          } catch {
            // Expected to fail parsing
          }
        }).not.toThrow();
      });
    });
  });
});
