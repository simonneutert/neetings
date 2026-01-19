/**
 * Custom hook for handling drag and drop operations in KanbanBoard
 */

import { useCallback, useState } from "preact/hooks";
import { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { Block, normalizeTopicGroupId } from "../types/Block";
import {
  calculateInterColumnSortKey,
  calculateIntraColumnSortKey,
} from "../utils/kanbanSortKeys";
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
          // Calculate new sort key for intra-column reordering
          const newSortKey = calculateIntraColumnSortKey(
            groupedBlocks,
            normalizedFromTopicId,
            activeIndex,
            overIndex,
            globalBlockId,
          );

          // Update block directly by ID
          updateBlockById(globalBlockId, { sortKey: newSortKey });
        }
        return;
      }

      // Moving between different columns - calculate precise position
      const targetTopicBlocks = groupedBlocks.get(normalizedOverTopicId) || [];
      const overIndex = targetTopicBlocks.findIndex((b) =>
        b.id === overGlobalBlockId
      );

      const newSortKey = calculateInterColumnSortKey(
        targetTopicBlocks,
        overIndex,
      );

      updateBlockById(globalBlockId, {
        topicGroupId: normalizedOverTopicId,
        sortKey: newSortKey,
      });
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
