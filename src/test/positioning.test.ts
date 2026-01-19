import { describe, expect, it } from "vitest";
import {
  calculateInsertSortKeyBetween,
  createBlockForTopic,
  getBlocksForTopic,
  groupAndSortBlocks,
  moveBlockInTopic,
  sortTopicBlocks,
} from "../utils/positioning";
import { Block } from "../types/Block";

// Helper to create test blocks
const createTestBlock = (
  id: string,
  type: Block["type"] = "textblock",
  sortKey: string = "m",
  topicGroupId: string | null = null,
): Block => ({
  id,
  type,
  sortKey,
  topicGroupId,
  created_at: new Date().toISOString(),
  text: `Block ${id}`,
});

describe("positioning utilities", () => {
  describe("getBlocksForTopic", () => {
    const blocks: Block[] = [
      createTestBlock("1", "textblock", "a", null),
      createTestBlock("2", "textblock", "b", "topic1"),
      createTestBlock("3", "textblock", "c", null),
      createTestBlock("4", "textblock", "d", "topic1"),
      createTestBlock("5", "textblock", "e", "topic2"),
    ];

    it("filters blocks by topic ID", () => {
      const topic1Blocks = getBlocksForTopic(blocks, "topic1");
      expect(topic1Blocks).toHaveLength(2);
      expect(topic1Blocks.map((b) => b.id)).toEqual(["2", "4"]);
    });

    it("filters blocks for default topic (null)", () => {
      const defaultBlocks = getBlocksForTopic(blocks, null);
      expect(defaultBlocks).toHaveLength(2);
      expect(defaultBlocks.map((b) => b.id)).toEqual(["1", "3"]);
    });

    it("handles undefined topic ID as null", () => {
      const defaultBlocks = getBlocksForTopic(blocks, undefined);
      expect(defaultBlocks).toHaveLength(2);
      expect(defaultBlocks.map((b) => b.id)).toEqual(["1", "3"]);
    });

    it("returns empty array for non-existent topic", () => {
      const nonExistentBlocks = getBlocksForTopic(blocks, "nonexistent");
      expect(nonExistentBlocks).toHaveLength(0);
    });

    it("handles empty blocks array", () => {
      const result = getBlocksForTopic([], "topic1");
      expect(result).toEqual([]);
    });
  });

  describe("sortTopicBlocks", () => {
    it("sorts blocks by sort key within topic", () => {
      const blocks: Block[] = [
        createTestBlock("1", "textblock", "z", "topic1"),
        createTestBlock("2", "textblock", "a", "topic1"),
        createTestBlock("3", "textblock", "m", "topic1"),
        createTestBlock("4", "textblock", "b", "topic2"), // Different topic, should be excluded
      ];

      const sorted = sortTopicBlocks(blocks, "topic1");
      expect(sorted).toHaveLength(3);
      expect(sorted.map((b) => b.id)).toEqual(["2", "3", "1"]); // a, m, z order
      expect(sorted.map((b) => b.sortKey)).toEqual(["a", "m", "z"]);
    });

    it("handles empty topic", () => {
      const blocks: Block[] = [
        createTestBlock("1", "textblock", "a", "topic1"),
      ];

      const sorted = sortTopicBlocks(blocks, "nonexistent");
      expect(sorted).toEqual([]);
    });

    it("handles default topic (null)", () => {
      const blocks: Block[] = [
        createTestBlock("1", "textblock", "z", null),
        createTestBlock("2", "textblock", "a", null),
      ];

      const sorted = sortTopicBlocks(blocks, null);
      expect(sorted.map((b) => b.sortKey)).toEqual(["a", "z"]);
    });
  });

  describe("calculateInsertSortKeyBetween", () => {
    it("calculates key between two blocks", () => {
      const blockA = createTestBlock("1", "textblock", "a");
      const blockZ = createTestBlock("2", "textblock", "z");

      const betweenKey = calculateInsertSortKeyBetween(blockA, blockZ);

      expect(betweenKey > "a").toBe(true);
      expect(betweenKey < "z").toBe(true);
    });

    it("calculates key before first block", () => {
      const blockM = createTestBlock("1", "textblock", "m");

      const beforeKey = calculateInsertSortKeyBetween(null, blockM);

      expect(beforeKey < "m").toBe(true);
    });

    it("calculates key after last block", () => {
      const blockM = createTestBlock("1", "textblock", "m");

      const afterKey = calculateInsertSortKeyBetween(blockM, null);

      expect(afterKey > "m").toBe(true);
    });

    it("handles null for both parameters", () => {
      const key = calculateInsertSortKeyBetween(null, null);
      expect(key).toBe("m"); // Should generate default key
    });
  });

  describe("createBlockForTopic", () => {
    it("creates block with correct topic and sort key", () => {
      const existingBlocks: Block[] = [
        createTestBlock("1", "textblock", "a", "topic1"),
        createTestBlock("2", "textblock", "m", "topic1"),
      ];

      const newBlock = createBlockForTopic(
        "qandablock",
        "topic1",
        existingBlocks,
      );

      expect(newBlock.type).toBe("qandablock");
      expect(newBlock.topicGroupId).toBe("topic1");
      expect(newBlock.sortKey > "m").toBe(true); // Should be after last block
      expect(newBlock.id).toBeDefined();
      expect(newBlock.created_at).toBeDefined();
    });

    it("creates block for default topic", () => {
      const newBlock = createBlockForTopic("textblock", null, []);

      expect(newBlock.topicGroupId).toBe(null);
      expect(newBlock.sortKey).toBeDefined();
    });

    it("creates block for empty topic", () => {
      const newBlock = createBlockForTopic("textblock", "topic1", []);

      expect(newBlock.topicGroupId).toBe("topic1");
      expect(newBlock.sortKey).toBeDefined();
    });

    it("handles undefined topic ID", () => {
      const newBlock = createBlockForTopic("textblock", undefined, []);

      expect(newBlock.topicGroupId).toBe(null);
    });
  });

  describe("moveBlockInTopic", () => {
    const createTopicBlocks = (): Block[] => [
      createTestBlock("1", "textblock", "a", "topic1"),
      createTestBlock("2", "textblock", "m", "topic1"),
      createTestBlock("3", "textblock", "z", "topic1"),
    ];

    it("moves block to beginning", () => {
      const blocks = createTopicBlocks();
      const blockToMove = blocks[1]; // "m" block

      const movedBlock = moveBlockInTopic(blockToMove, 0, blocks);

      expect(movedBlock.id).toBe("2");
      expect(movedBlock.sortKey < "a").toBe(true); // Should be before first block
    });

    it("moves block to end", () => {
      const blocks = createTopicBlocks();
      const blockToMove = blocks[0]; // "a" block

      const movedBlock = moveBlockInTopic(blockToMove, 2, blocks);

      expect(movedBlock.id).toBe("1");
      expect(movedBlock.sortKey > "z").toBe(true); // Should be after last block
    });

    it("moves block to middle", () => {
      const blocks = createTopicBlocks();
      const blockToMove = blocks[2]; // "z" block

      const movedBlock = moveBlockInTopic(blockToMove, 1, blocks);

      expect(movedBlock.id).toBe("3");
      expect(movedBlock.sortKey > "a").toBe(true);
      expect(movedBlock.sortKey < "m").toBe(true);
    });

    it("handles out of bounds indices", () => {
      const blocks = createTopicBlocks();
      const blockToMove = blocks[1];

      // Moving to negative index should move to beginning
      const movedToStart = moveBlockInTopic(blockToMove, -1, blocks);
      expect(movedToStart.sortKey < "a").toBe(true);

      // Moving to index beyond length should move to end
      const movedToEnd = moveBlockInTopic(blockToMove, 999, blocks);
      expect(movedToEnd.sortKey > "z").toBe(true);
    });
  });

  describe("groupAndSortBlocks", () => {
    it("groups blocks by topic and sorts each group", () => {
      const blocks: Block[] = [
        createTestBlock("1", "textblock", "z", "topic1"),
        createTestBlock("2", "textblock", "a", null),
        createTestBlock("3", "textblock", "a", "topic1"),
        createTestBlock("4", "textblock", "z", null),
        createTestBlock("5", "textblock", "m", "topic2"),
      ];

      const grouped = groupAndSortBlocks(blocks);

      expect(grouped.size).toBe(3); // null, topic1, topic2

      // Check default topic (null)
      const defaultBlocks = grouped.get(null)!;
      expect(defaultBlocks).toHaveLength(2);
      expect(defaultBlocks.map((b) => b.id)).toEqual(["2", "4"]); // a, z order

      // Check topic1
      const topic1Blocks = grouped.get("topic1")!;
      expect(topic1Blocks).toHaveLength(2);
      expect(topic1Blocks.map((b) => b.id)).toEqual(["3", "1"]); // a, z order

      // Check topic2
      const topic2Blocks = grouped.get("topic2")!;
      expect(topic2Blocks).toHaveLength(1);
      expect(topic2Blocks[0].id).toBe("5");
    });

    it("handles empty blocks array", () => {
      const grouped = groupAndSortBlocks([]);
      expect(grouped.size).toBe(0);
    });

    it("handles single topic", () => {
      const blocks: Block[] = [
        createTestBlock("1", "textblock", "z", "topic1"),
        createTestBlock("2", "textblock", "a", "topic1"),
      ];

      const grouped = groupAndSortBlocks(blocks);

      expect(grouped.size).toBe(1);
      const topic1Blocks = grouped.get("topic1")!;
      expect(topic1Blocks.map((b) => b.id)).toEqual(["2", "1"]); // a, z order
    });

    it("normalizes topic IDs consistently", () => {
      const blocks: Block[] = [
        createTestBlock("1", "textblock", "a", null),
        createTestBlock("2", "textblock", "b", undefined as any),
      ];

      const grouped = groupAndSortBlocks(blocks);

      expect(grouped.size).toBe(1);
      expect(grouped.has(null)).toBe(true);
      expect(grouped.get(null)).toHaveLength(2);
    });
  });

  describe("integration scenarios", () => {
    it("handles complex positioning workflow", () => {
      // Start with some blocks
      const blocks: Block[] = [
        createTestBlock("1", "textblock", "m", "topic1"),
      ];

      // Add block at end
      const newBlock = createBlockForTopic("qandablock", "topic1", blocks);
      blocks.push(newBlock);

      // Sort the topic
      const sorted = sortTopicBlocks(blocks, "topic1");
      expect(sorted).toHaveLength(2);
      expect(sorted[0].sortKey < sorted[1].sortKey).toBe(true);

      // Move second block to first position
      const moved = moveBlockInTopic(sorted[1], 0, sorted);
      expect(moved.sortKey < sorted[0].sortKey).toBe(true);
    });

    it("maintains ordering through multiple operations", () => {
      const blocks: Block[] = [
        createTestBlock("1", "textblock", "a", "topic1"),
        createTestBlock("2", "textblock", "m", "topic1"),
        createTestBlock("3", "textblock", "z", "topic1"),
      ];

      // Insert between first and second
      const insertKey = calculateInsertSortKeyBetween(blocks[0], blocks[1]);
      const newBlock = createTestBlock("4", "textblock", insertKey, "topic1");
      blocks.push(newBlock);

      // Sort and verify order
      const sorted = sortTopicBlocks(blocks, "topic1");
      expect(sorted.map((b) => b.id)).toEqual(["1", "4", "2", "3"]);

      // Verify all sort keys are properly ordered
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].sortKey < sorted[i + 1].sortKey).toBe(true);
      }
    });
  });
});
