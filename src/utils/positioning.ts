import { Block, createBlock, normalizeTopicGroupId } from "../types/Block";
import { generateSortKey, sortBySortKey } from "./sortKeys";

/**
 * Gets blocks that belong to a specific topic group
 */
export function getBlocksForTopic(
  blocks: Block[],
  topicId: string | null | undefined,
): Block[] {
  const normalizedTopicId = normalizeTopicGroupId(topicId);
  return blocks.filter((block) => {
    return normalizeTopicGroupId(block.topicGroupId) === normalizedTopicId;
  });
}

/**
 * Sorts blocks within a specific topic group by their sort keys
 */
export function sortTopicBlocks(
  blocks: Block[],
  topicId: string | null | undefined,
): Block[] {
  const topicBlocks = getBlocksForTopic(blocks, topicId);
  return sortBySortKey(topicBlocks);
}

/**
 * Calculates sort key for inserting a block between two specific blocks
 */
export function calculateInsertSortKeyBetween(
  beforeBlock: Block | null,
  afterBlock: Block | null,
): string {
  const beforeKey = beforeBlock?.sortKey;
  const afterKey = afterBlock?.sortKey;

  return generateSortKey(beforeKey, afterKey);
}

/**
 * Creates a new block with appropriate sort key for a topic
 */
export function createBlockForTopic(
  blockType: Block["type"],
  topicId: string | null | undefined,
  existingBlocks: Block[],
): Block {
  const normalizedTopicId = normalizeTopicGroupId(topicId);
  const topicBlocks = getBlocksForTopic(existingBlocks, normalizedTopicId);

  // Insert at end - generate sort key after the last block
  let sortKey: string;
  if (topicBlocks.length > 0) {
    const sortedBlocks = sortBySortKey(topicBlocks);
    const lastBlock = sortedBlocks[sortedBlocks.length - 1];
    sortKey = generateSortKey(lastBlock.sortKey);
  } else {
    sortKey = generateSortKey();
  }

  return createBlock(blockType, normalizedTopicId, sortKey);
}

/**
 * Updates a block's sort key to move it to a specific position within its topic
 */
export function moveBlockInTopic(
  block: Block,
  targetIndex: number,
  topicBlocks: Block[],
): Block {
  const sortedBlocks = sortBySortKey(
    topicBlocks.filter((b) => b.id !== block.id),
  );

  let beforeBlock: Block | null = null;
  let afterBlock: Block | null = null;

  if (targetIndex <= 0) {
    // Move to beginning
    afterBlock = sortedBlocks[0] || null;
  } else if (targetIndex >= sortedBlocks.length) {
    // Move to end
    beforeBlock = sortedBlocks[sortedBlocks.length - 1] || null;
  } else {
    // Move between blocks
    beforeBlock = sortedBlocks[targetIndex - 1];
    afterBlock = sortedBlocks[targetIndex];
  }

  const newSortKey = calculateInsertSortKeyBetween(beforeBlock, afterBlock);

  return {
    ...block,
    sortKey: newSortKey,
  };
}

/**
 * Groups blocks by topic and sorts each group
 */
export function groupAndSortBlocks(
  blocks: Block[],
): Map<string | null, Block[]> {
  const grouped = new Map<string | null, Block[]>();

  blocks.forEach((block) => {
    const topicId = normalizeTopicGroupId(block.topicGroupId);
    if (!grouped.has(topicId)) {
      grouped.set(topicId, []);
    }
    grouped.get(topicId)!.push(block);
  });

  // Sort each group
  grouped.forEach((topicBlocks, topicId) => {
    grouped.set(topicId, sortBySortKey(topicBlocks));
  });

  return grouped;
}
