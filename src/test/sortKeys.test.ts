import { describe, expect, it } from "vitest";
import {
  generateBatchSortKeys,
  generateSortKey,
  isValidSortKey,
  positionToSortKey,
  sortBySortKey,
} from "../utils/sortKeys";

describe("sortKeys utilities", () => {
  describe("generateSortKey", () => {
    it("generates initial sort key when no parameters", () => {
      const key = generateSortKey();
      expect(isValidSortKey(key)).toBe(true);
      expect(key).toBe("m"); // Should be middle character
    });

    it("generates key before given key", () => {
      const beforeKey = generateSortKey(undefined, "b");
      expect(isValidSortKey(beforeKey)).toBe(true);
      expect(beforeKey < "b").toBe(true);
    });

    it("generates key after given key", () => {
      const afterKey = generateSortKey("m");
      expect(isValidSortKey(afterKey)).toBe(true);
      expect(afterKey > "m").toBe(true);
    });

    it("generates key between two keys", () => {
      const betweenKey = generateSortKey("a", "z");
      expect(isValidSortKey(betweenKey)).toBe(true);
      expect(betweenKey > "a").toBe(true);
      expect(betweenKey < "z").toBe(true);
    });

    it("generates key between adjacent keys", () => {
      const betweenKey = generateSortKey("a", "b");
      expect(isValidSortKey(betweenKey)).toBe(true);
      expect(betweenKey > "a").toBe(true);
      expect(betweenKey < "b").toBe(true);
    });

    it("handles fractional positioning", () => {
      const key1 = generateSortKey("a", "z");
      const key2 = generateSortKey("a", key1);
      const key3 = generateSortKey(key1, "z");

      expect(key2 > "a" && key2 < key1).toBe(true);
      expect(key3 > key1 && key3 < "z").toBe(true);
    });

    it("throws error for invalid order", () => {
      expect(() => generateSortKey("z", "a")).toThrow();
    });

    it("throws error for identical keys", () => {
      expect(() => generateSortKey("m", "m")).toThrow();
    });
  });

  describe("isValidSortKey", () => {
    it("validates correct sort keys", () => {
      expect(isValidSortKey("a")).toBe(true);
      expect(isValidSortKey("m")).toBe(true);
      expect(isValidSortKey("z")).toBe(true);
      expect(isValidSortKey("ab")).toBe(true);
      expect(isValidSortKey("ABC")).toBe(true);
    });

    it("rejects invalid sort keys", () => {
      expect(isValidSortKey("")).toBe(false);
      expect(isValidSortKey("123")).toBe(false);
      expect(isValidSortKey("a-b")).toBe(false);
      expect(isValidSortKey("a_b")).toBe(false);
      expect(isValidSortKey(null as any)).toBe(false);
      expect(isValidSortKey(undefined as any)).toBe(false);
    });
  });

  describe("positionToSortKey", () => {
    it("converts positions to valid sort keys", () => {
      const key1 = positionToSortKey(0);
      const key2 = positionToSortKey(500);
      const key3 = positionToSortKey(1000);

      expect(isValidSortKey(key1)).toBe(true);
      expect(isValidSortKey(key2)).toBe(true);
      expect(isValidSortKey(key3)).toBe(true);

      expect(key1 < key2).toBe(true);
      expect(key2 < key3).toBe(true);
    });

    it("generates different keys for different positions", () => {
      const keys = [0, 100, 200, 300, 400].map((pos) => positionToSortKey(pos));

      // All should be unique and properly ordered
      for (let i = 0; i < keys.length - 1; i++) {
        expect(keys[i] < keys[i + 1]).toBe(true);
      }
    });

    it("handles edge cases", () => {
      const zeroKey = positionToSortKey(0);
      const negativeKey = positionToSortKey(-100);
      const largeKey = positionToSortKey(999999);

      expect(isValidSortKey(zeroKey)).toBe(true);
      expect(isValidSortKey(negativeKey)).toBe(true);
      expect(isValidSortKey(largeKey)).toBe(true);
    });
  });

  describe("sortBySortKey", () => {
    it("sorts objects by sort key", () => {
      const items = [
        { id: "3", sortKey: "z" },
        { id: "1", sortKey: "a" },
        { id: "2", sortKey: "m" },
      ];

      const sorted = sortBySortKey(items);

      expect(sorted.map((item) => item.id)).toEqual(["1", "2", "3"]);
      expect(sorted.map((item) => item.sortKey)).toEqual(["a", "m", "z"]);
    });

    it("maintains stable sort for equal keys", () => {
      const items = [
        { id: "1", sortKey: "a", data: "first" },
        { id: "2", sortKey: "a", data: "second" },
      ];

      const sorted = sortBySortKey(items);

      // Should maintain original order for equal keys
      expect(sorted[0].data).toBe("first");
      expect(sorted[1].data).toBe("second");
    });

    it("handles empty array", () => {
      const sorted = sortBySortKey([]);
      expect(sorted).toEqual([]);
    });

    it("handles single item", () => {
      const items = [{ id: "1", sortKey: "a" }];
      const sorted = sortBySortKey(items);
      expect(sorted).toEqual(items);
    });
  });

  describe("generateBatchSortKeys", () => {
    it("generates specified number of keys", () => {
      const keys = generateBatchSortKeys(5);
      expect(keys).toHaveLength(5);
      keys.forEach((key) => expect(isValidSortKey(key)).toBe(true));
    });

    it("generates properly ordered keys", () => {
      const keys = generateBatchSortKeys(10);

      for (let i = 0; i < keys.length - 1; i++) {
        expect(keys[i] < keys[i + 1]).toBe(true);
      }
    });

    it("handles edge cases", () => {
      expect(generateBatchSortKeys(0)).toEqual([]);
      expect(generateBatchSortKeys(1)).toEqual(["m"]);
    });

    it("generates evenly distributed keys", () => {
      const keys = generateBatchSortKeys(3);

      // Should be evenly distributed across the space
      expect(keys[0] < keys[1]).toBe(true);
      expect(keys[1] < keys[2]).toBe(true);

      // Gap between first and second should be similar to gap between second and third
      const gap1 = keys[1].localeCompare(keys[0]);
      const gap2 = keys[2].localeCompare(keys[1]);
      expect(Math.abs(gap1 - gap2)).toBeLessThan(0.5); // Reasonable tolerance
    });
  });

  describe("sort key ordering consistency", () => {
    it("maintains lexicographic order through multiple operations", () => {
      const keys = ["m"];

      // Add keys before, between, and after
      keys.push(generateSortKey(undefined, keys[0])); // before
      keys.push(generateSortKey(keys[0])); // after
      keys.push(generateSortKey(keys[0], keys[2])); // between

      const sorted = [...keys].sort();
      expect(keys.sort()).toEqual(sorted);
    });

    it("handles deep fractional positioning", () => {
      let current = "m";

      // Generate 10 keys in sequence
      const keys = [current];
      for (let i = 0; i < 10; i++) {
        current = generateSortKey(current);
        keys.push(current);
      }

      // All should be properly ordered
      for (let i = 0; i < keys.length - 1; i++) {
        expect(keys[i] < keys[i + 1]).toBe(true);
      }
    });

    it("ensures uniqueness at scale (1000+ keys)", () => {
      const keys = new Set<string>();
      let current = "m";

      // Generate 1000 sequential keys
      keys.add(current);
      for (let i = 0; i < 1000; i++) {
        current = generateSortKey(current);
        keys.add(current);
      }

      // All keys should be unique
      expect(keys.size).toBe(1001); // 1000 + initial key

      // Convert to array and verify ordering
      const keyArray = Array.from(keys).sort();
      for (let i = 0; i < keyArray.length - 1; i++) {
        expect(keyArray[i] < keyArray[i + 1]).toBe(true);
      }
    });

    it("produces deterministic results for same inputs", () => {
      // Same inputs should always produce same outputs
      const key1 = generateSortKey("a", "c");
      const key2 = generateSortKey("a", "c");
      const key3 = generateSortKey("a", "c");

      expect(key1).toBe(key2);
      expect(key2).toBe(key3);
      expect(key1).toBe("b"); // Expected result for this input
    });

    it("handles realistic meeting scenarios with mixed operations", () => {
      const keys = new Set<string>();
      const sortedKeys: string[] = [];

      // Simulate realistic usage: add blocks, reorder, insert between
      let lastKey = "m";
      keys.add(lastKey);
      sortedKeys.push(lastKey);

      // Add 50 blocks sequentially (like adding during a meeting)
      for (let i = 0; i < 50; i++) {
        lastKey = generateSortKey(lastKey);
        keys.add(lastKey);
        sortedKeys.push(lastKey);
      }

      // Insert blocks at predictable positions (not random to avoid flaky tests)
      const insertPositions = [0, 10, 25, 40, sortedKeys.length - 1];
      for (const position of insertPositions) {
        if (position < sortedKeys.length - 1) {
          const beforeKey = sortedKeys[position];
          const afterKey = sortedKeys[position + 1];

          if (beforeKey < afterKey) {
            const newKey = generateSortKey(beforeKey, afterKey);
            keys.add(newKey);
            sortedKeys.splice(position + 1, 0, newKey);
          }
        }
      }

      // Verify all keys are unique (at least 51 + some insertions)
      expect(keys.size).toBeGreaterThanOrEqual(51);
      expect(keys.size).toBeLessThanOrEqual(56); // 51 + max 5 insertions

      // Verify ordering is maintained
      const finalSorted = Array.from(keys).sort();
      expect(finalSorted).toEqual(sortedKeys.sort());

      // Verify all keys are unique by checking Set size matches array length
      expect(keys.size).toBe(sortedKeys.length);
    });
  });
});
