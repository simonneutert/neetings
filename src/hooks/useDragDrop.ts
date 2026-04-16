/**
 * Custom hook for handling drag and drop operations in KanbanBoard
 */

import { useCallback, useState } from "preact/hooks";
import { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { Block, normalizeTopicGroupId } from "../types/Block";
import { generateSortKey } from "../utils/sortKeys";

/**
 * Active block state during drag operations
 */
interface ActiveBlockState {
  block: Block;
  index: number;
  topicId: string | null;
}

interface UseDragDropProps {
  groupedBlocks: Map<string | null, Block[]>;
  updateBlockById: (blockId: string, updates: Partial<Block>) => void;
}

interface DragDropOperations {
  activeBlock: ActiveBlockState | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
}

/**
 * Hook that manages drag and drop state and operations for KanbanBoard
 */
export function useDragDrop({
  groupedBlocks,
  updateBlockById,
}: UseDragDropProps): DragDropOperations {
  const [activeBlock, setActiveBlock] = useState<ActiveBlockState | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeData = event.active.data.current;
    if (activeData) {
      const { block, blockIndex, fromTopicId } = activeData;
      setActiveBlock({
        block,
        index: blockIndex,
        topicId: fromTopicId || null,
      });
    }
  }, []);

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Optional: Add visual feedback during drag
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    setActiveBlock(null); // Clear active block

    if (!over || active.id === over.id) {
      return;
    }

    // Extract block information from active id
    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData) {
      return;
    }

    const { fromTopicId, globalBlockId } = activeData;

    // Handle different drop scenarios
    if (overData && overData.type === "block") {
      // Dropped over another block - handle reordering within column or between columns
      const {
        fromTopicId: overFromTopicId,
        globalBlockId: overGlobalBlockId,
      } = overData;

      const normalizedFromTopicId = normalizeTopicGroupId(fromTopicId);
      const normalizedOverTopicId = normalizeTopicGroupId(overFromTopicId);

      if (normalizedFromTopicId === normalizedOverTopicId) {
        // Intra-column reordering - use sort key positioning
        const topicBlocks = groupedBlocks.get(normalizedFromTopicId) || [];

        const activeIndex = topicBlocks.findIndex((b) =>
          b.id === globalBlockId
        );
        const overIndex = topicBlocks.findIndex((b) =>
          b.id === overGlobalBlockId
        );

        if (
          activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex
        ) {
          try {
            // Intra-column reordering: calculate sort key between neighbors
            const blocksWithoutMoving = topicBlocks.filter(
              (b) => b.id !== globalBlockId,
            );
            let beforeBlock: Block | null = null;
            let afterBlock: Block | null = null;
            if (activeIndex < overIndex) {
              beforeBlock = blocksWithoutMoving[overIndex - 1] || null;
              afterBlock = blocksWithoutMoving[overIndex] || null;
            } else {
              beforeBlock = overIndex > 0
                ? blocksWithoutMoving[overIndex - 1]
                : null;
              afterBlock = blocksWithoutMoving[overIndex] || null;
            }
            const newSortKey = generateSortKey(
              beforeBlock?.sortKey,
              afterBlock?.sortKey,
            );

            // Update block directly by ID
            updateBlockById(globalBlockId, { sortKey: newSortKey });
          } catch {
            // Sort key calculation failed (e.g. due to corrupt/duplicate keys).
            // Skip this move — the block stays where it is.
          }
        }
        return;
      }

      // Moving between different columns - calculate precise position
      const targetTopicBlocks = groupedBlocks.get(normalizedOverTopicId) || [];
      const overIndex = targetTopicBlocks.findIndex((b) =>
        b.id === overGlobalBlockId
      );

      try {
        // Inter-column move: calculate sort key at target position
        let newSortKey: string;
        if (overIndex === -1 || overIndex >= targetTopicBlocks.length) {
          newSortKey = targetTopicBlocks.length > 0
            ? generateSortKey(
              targetTopicBlocks[targetTopicBlocks.length - 1].sortKey,
            )
            : generateSortKey();
        } else {
          const beforeBlock = overIndex > 0
            ? targetTopicBlocks[overIndex - 1]
            : null;
          const afterBlock = targetTopicBlocks[overIndex];
          newSortKey = generateSortKey(
            beforeBlock?.sortKey,
            afterBlock?.sortKey,
          );
        }

        updateBlockById(globalBlockId, {
          topicGroupId: normalizedOverTopicId,
          sortKey: newSortKey,
        });
      } catch {
        // Fall back to appending the block to the end of the target column.
        const lastBlock = targetTopicBlocks[targetTopicBlocks.length - 1];
        const fallbackKey = lastBlock
          ? generateSortKey(lastBlock.sortKey, undefined)
          : generateSortKey();
        updateBlockById(globalBlockId, {
          topicGroupId: normalizedOverTopicId,
          sortKey: fallbackKey,
        });
      }
    } else {
      // Dropped over a column (not a specific block) - handle inter-column moves
      const overTopicId = over.id === "default" ? null : over.id as string;
      const normalizedFromTopicId = normalizeTopicGroupId(fromTopicId);
      const normalizedOverTopicId = normalizeTopicGroupId(overTopicId);

      // Only move if dropping on a different topic
      if (normalizedFromTopicId !== normalizedOverTopicId) {
        // Generate appropriate sort key for the target column
        const targetTopicBlocks = groupedBlocks.get(normalizedOverTopicId) ||
          [];
        const newSortKey = targetTopicBlocks.length > 0
          ? generateSortKey(
            targetTopicBlocks[targetTopicBlocks.length - 1].sortKey,
            undefined,
          )
          : generateSortKey();

        updateBlockById(globalBlockId, {
          topicGroupId: normalizedOverTopicId,
          sortKey: newSortKey,
        });
      }
    }
  }, [groupedBlocks, updateBlockById]);

  return {
    activeBlock,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
