/**
 * Custom hook for block CRUD operations within the KanbanBoard
 */

import { useCallback } from "preact/hooks";
import { Block, createBlock, normalizeTopicGroupId } from "../types/Block";
import { Meeting } from "../types/Meeting";
import {
  calculateSortKeyForPosition,
  generateSortKeyForNewBlock,
} from "../utils/kanbanSortKeys";
import { changeBlockTypeClearData } from "../utils/blockTypeChange";

interface UseBlockOperationsProps {
  meeting: Meeting;
  onBlockChange: (index: number, updatedBlock: Block) => void;
  onDeleteBlock: (index: number) => void;
  onAddBlock: (block: Block) => void;
}

interface BlockOperations {
  findBlockById: (blockId: string) => { block: Block; index: number } | null;
  updateBlockById: (blockId: string, updates: Partial<Block>) => void;
  deleteBlockById: (blockId: string) => void;
  createNewBlock: (blockType: Block["type"], topicGroupId?: string) => Block;
  moveBlockUpDown: (
    blockId: string,
    direction: "up" | "down",
    groupedBlocks: Map<string | null, Block[]>,
  ) => void;
  changeBlockType: (blockId: string, newType: Block["type"]) => void;
}

/**
 * Hook that provides block operation utilities for KanbanBoard
 */
export function useBlockOperations({
  meeting,
  onBlockChange,
  onDeleteBlock,
}: UseBlockOperationsProps): BlockOperations {
  /**
   * Finds a block by ID and returns it with its global index
   */
  const findBlockById = useCallback((
    blockId: string,
  ): { block: Block; index: number } | null => {
    const index = meeting.blocks.findIndex((b) => b.id === blockId);
    return index !== -1 ? { block: meeting.blocks[index], index } : null;
  }, [meeting.blocks]);

  /**
   * Updates a block by ID with the provided updates
   */
  const updateBlockById = useCallback(
    (blockId: string, updates: Partial<Block>) => {
      const found = findBlockById(blockId);
      if (found) {
        const updatedBlock = { ...found.block, ...updates };
        onBlockChange(found.index, updatedBlock);
      }
    },
    [findBlockById, onBlockChange],
  );

  /**
   * Deletes a block by ID
   */
  const deleteBlockById = useCallback((blockId: string) => {
    const found = findBlockById(blockId);
    if (found) {
      onDeleteBlock(found.index);
    }
  }, [findBlockById, onDeleteBlock]);

  /**
   * Creates a new block with the specified type and topic group
   */
  const createNewBlock = useCallback((
    blockType: Block["type"],
    topicGroupId?: string,
  ): Block => {
    const normalizedTopicId = normalizeTopicGroupId(topicGroupId);
    const sortKey = generateSortKeyForNewBlock(
      meeting.blocks,
      normalizedTopicId,
    );
    return createBlock(blockType, normalizedTopicId, sortKey);
  }, [meeting.blocks]);

  /**
   * Moves a block up or down within its topic group
   */
  const moveBlockUpDown = useCallback((
    blockId: string,
    direction: "up" | "down",
    groupedBlocks: Map<string | null, Block[]>,
  ) => {
    const found = findBlockById(blockId);
    if (!found) return;

    const { block } = found;
    const normalizedTopicId = normalizeTopicGroupId(block.topicGroupId);
    const topicBlocks = groupedBlocks.get(normalizedTopicId) || [];

    const blockIndex = topicBlocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return;

    // Calculate new target index
    const newIndex = direction === "up" ? blockIndex - 1 : blockIndex + 1;

    // Check bounds
    if (newIndex < 0 || newIndex >= topicBlocks.length) {
      return;
    }

    // Calculate new sort key for the target position
    const newSortKey = calculateSortKeyForPosition(
      meeting.blocks,
      normalizedTopicId,
      newIndex,
      blockId,
    );

    updateBlockById(blockId, { sortKey: newSortKey });
  }, [findBlockById, meeting.blocks, updateBlockById]);

  /**
   * Changes the type of an existing block
   */
  const changeBlockType = useCallback(
    (blockId: string, newType: Block["type"]) => {
      const found = findBlockById(blockId);
      if (found) {
        const updatedBlock = changeBlockTypeClearData(found.block, newType);
        updateBlockById(blockId, updatedBlock);
      }
    },
    [findBlockById, updateBlockById],
  );

  return {
    findBlockById,
    updateBlockById,
    deleteBlockById,
    createNewBlock,
    moveBlockUpDown,
    changeBlockType,
  };
}
