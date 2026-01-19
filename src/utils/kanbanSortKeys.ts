/**
 * Kanban-specific sort key utilities for positioning blocks within topic groups
 */

import { Block, normalizeTopicGroupId } from "../types/Block";
import {
  calculateInsertSortKeyBetween,
  getBlocksForTopic,
  groupAndSortBlocks,
} from "./positioning";
import { generateSortKey, sortBySortKey } from "./sortKeys";

/**
 * Calculates the sort key for inserting a block at a specific position within a topic
 * @param blocks - All blocks in the meeting
 * @param topicId - The topic group ID (null for default column)
 * @param targetIndex - The desired position index within the topic
 * @param excludeBlockId - Block ID to exclude from position calculations (for moves)
 * @returns The calculated sort key for the new position
 */
export function calculateSortKeyForPosition(
  blocks: Block[],
  topicId: string | null,
  targetIndex: number,
  excludeBlockId?: string,
): string {
  const groupedBlocks = groupAndSortBlocks(blocks);
  const topicBlocks = groupedBlocks.get(normalizeTopicGroupId(topicId)) || [];

  // Filter out the moving block to get accurate positioning
  const availableBlocks = excludeBlockId
    ? topicBlocks.filter((b) => b.id !== excludeBlockId)
    : topicBlocks;

  if (targetIndex <= 0) {
    // Insert at beginning
    const firstBlock = availableBlocks[0] || null;
    return calculateInsertSortKeyBetween(null, firstBlock);
  }

  if (targetIndex >= availableBlocks.length) {
    // Insert at end
    const lastBlock = availableBlocks[availableBlocks.length - 1] || null;
    return generateSortKey(lastBlock?.sortKey);
  }

  // Insert between blocks
  const beforeBlock = availableBlocks[targetIndex - 1];
  const afterBlock = availableBlocks[targetIndex];
  return calculateInsertSortKeyBetween(beforeBlock, afterBlock);
}

/**
 * Generates a sort key for a new block at the end of a topic group
 * @param blocks - All blocks in the meeting
 * @param topicId - The topic group ID (null for default column)
 * @returns The calculated sort key for appending to the end
 */
export function generateSortKeyForNewBlock(
  blocks: Block[],
  topicId: string | null,
): string {
  const normalizedTopicId = normalizeTopicGroupId(topicId);
  const topicBlocks = getBlocksForTopic(blocks, normalizedTopicId);

  if (topicBlocks.length > 0) {
    const sortedBlocks = sortBySortKey(topicBlocks);
    const lastBlock = sortedBlocks[sortedBlocks.length - 1];
    return generateSortKey(lastBlock.sortKey);
  }

  return generateSortKey();
}

/**
 * Calculates sort key for intra-column block reordering
 * @param groupedBlocks - Pre-grouped blocks by topic
 * @param fromTopicId - Source topic ID
 * @param activeIndex - Current index of the moving block
 * @param overIndex - Target index for the block
 * @param movingBlockId - ID of the block being moved
 * @returns The new sort key for the moved block
 */
export function calculateIntraColumnSortKey(
  groupedBlocks: Map<string | null, Block[]>,
  fromTopicId: string | null,
  activeIndex: number,
  overIndex: number,
  movingBlockId: string,
): string {
  const normalizedTopicId = normalizeTopicGroupId(fromTopicId);
  const topicBlocks = groupedBlocks.get(normalizedTopicId) || [];

  // Remove the moving block from consideration
  const blocksWithoutMoving = topicBlocks.filter((b) => b.id !== movingBlockId);

  let beforeBlock: Block | null = null;
  let afterBlock: Block | null = null;

  if (activeIndex < overIndex) {
    // Moving down - insert after the target block
    beforeBlock = blocksWithoutMoving[overIndex - 1] || null;
    afterBlock = blocksWithoutMoving[overIndex] || null;
  } else {
    // Moving up - insert before the target block
    beforeBlock = overIndex > 0 ? blocksWithoutMoving[overIndex - 1] : null;
    afterBlock = blocksWithoutMoving[overIndex] || null;
  }

  return calculateInsertSortKeyBetween(beforeBlock, afterBlock);
}

/**
 * Calculates sort key for inter-column block moves
 * @param targetTopicBlocks - Blocks in the target topic group
 * @param targetIndex - Index in target topic where block should be inserted
 * @returns The new sort key for the moved block
 */
export function calculateInterColumnSortKey(
  targetTopicBlocks: Block[],
  targetIndex: number,
): string {
  if (targetIndex === -1 || targetIndex >= targetTopicBlocks.length) {
    // Fallback: append to end
    return targetTopicBlocks.length > 0
      ? generateSortKey(targetTopicBlocks[targetTopicBlocks.length - 1].sortKey)
      : generateSortKey();
  }

  // Special case: if dropping on the last block, treat it as appending to end
  // This handles the common case where users drag to the "end" but hit the last block
  if (targetIndex === targetTopicBlocks.length - 1) {
    return targetTopicBlocks.length > 0
      ? generateSortKey(targetTopicBlocks[targetTopicBlocks.length - 1].sortKey)
      : generateSortKey();
  }

  // Insert at precise position - before the target block
  const beforeBlock = targetIndex > 0
    ? targetTopicBlocks[targetIndex - 1]
    : null;
  const afterBlock = targetTopicBlocks[targetIndex];
  return calculateInsertSortKeyBetween(beforeBlock, afterBlock);
}
