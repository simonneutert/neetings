import { FunctionalComponent } from "preact";
import { useMemo } from "preact/hooks";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Block } from "../types/Block";
import { Meeting } from "../types/Meeting";
import { TopicGroup } from "../types/TopicGroup";
import { EnhancedTopicColumn } from "./EnhancedTopicColumn";
import { TopicGroupManager } from "./TopicGroupManager";
import { UniversalBlock } from "./UniversalBlock";
import { BlockTypeModal } from "./BlockTypeModal";
import { groupAndSortBlocks } from "../utils/positioning";
import { useBlockOperations } from "../hooks/useBlockOperations";
import { useDragDrop } from "../hooks/useDragDrop";
import { useKanbanScroll } from "../hooks/useKanbanScroll";
import { useBlockTypeModal } from "../hooks/useBlockTypeModal";

/**
 * Block operations interface - handles all block CRUD operations
 */
interface BlockOperations {
  /** Add a new block to the meeting */
  addBlock: (block: Block) => void;
  /** Update a block by its global index */
  updateBlock: (index: number, updatedBlock: Block) => void;
  /** Delete a block by its global index */
  deleteBlock: (index: number) => void;
  /** Move a block to a different topic group */
  moveBlockToTopic: (
    blockIndex: number,
    topicGroupId: string | undefined,
  ) => void;
}

/**
 * Topic group operations interface - handles all topic group CRUD operations
 */
interface TopicOperations {
  /** Create a new topic group */
  createTopicGroup: (
    meetingId: string | null,
    name: string,
    color?: string,
  ) => void;
  /** Update an existing topic group */
  updateTopicGroup: (
    topicGroup: TopicGroup,
    updates: Partial<TopicGroup>,
  ) => void;
  /** Delete a topic group */
  deleteTopicGroup: (meetingId: string | null, topicGroupId: string) => void;
  /** Swap positions of topic groups */
  swapTopicGroups?: (
    meetingId: string | null,
    topicGroupId: string,
    direction: "left" | "right",
  ) => void;
}

/**
 * Simplified props interface for KanbanBoard component
 * Reduces complexity by passing operations objects instead of individual handlers
 */
interface KanbanBoardProps {
  /** Meeting ID to fetch meeting data internally */
  meetingId: string | null;
  /** Meeting data containing blocks and topic groups */
  meeting: Meeting;
  /** Block operations handlers */
  blockOperations: BlockOperations;
  /** Topic group operations handlers */
  topicOperations: TopicOperations;
  /** ID of newly created block for auto-focus */
  newlyCreatedBlockId: string | null;
}

export const KanbanBoard: FunctionalComponent<KanbanBoardProps> = ({
  meetingId,
  meeting,
  blockOperations,
  topicOperations,
  newlyCreatedBlockId,
}) => {
  // Initialize sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  );

  // Group and sort blocks using the clean utility (memoized for performance)
  const groupedBlocks = useMemo(() => {
    return groupAndSortBlocks(meeting.blocks);
  }, [meeting.blocks]);

  // Get topic groups, ensuring we always have at least the default column (memoized)
  const topicGroups = useMemo(() => {
    const groups = meeting.topicGroups || [];
    // Sort by order field
    return [...groups].sort((a, b) => a.order - b.order);
  }, [meeting.topicGroups]);
  const allTopicIds = useMemo(() => [
    null, // Always include the default/ungrouped column first
    ...topicGroups.map((tg) => tg.id),
  ], [topicGroups]);

  // Initialize custom hooks with new operation objects
  const blockOps = useBlockOperations({
    meeting,
    onBlockChange: blockOperations.updateBlock,
    onDeleteBlock: blockOperations.deleteBlock,
    onAddBlock: blockOperations.addBlock,
  });

  const { scrollContainerRef, scrollToTopic } = useKanbanScroll();

  const dragDropOperations = useDragDrop({
    groupedBlocks,
    updateBlockById: blockOps.updateBlockById,
  });

  const modalOperations = useBlockTypeModal();

  // Column handlers that bridge between column events and block operations
  const handleColumnBlockChange = (
    columnTopicId: string | null,
    blockIndex: number,
    updatedBlock: Block,
  ) => {
    // Find the block by ID in the global array (direct lookup)
    blockOps.updateBlockById(updatedBlock.id, updatedBlock);
  };

  const handleColumnMoveBlock = (
    columnTopicId: string | null,
    blockIndex: number,
    direction: "up" | "down",
  ) => {
    const topicBlocks = groupedBlocks.get(columnTopicId) || [];
    if (blockIndex >= 0 && blockIndex < topicBlocks.length) {
      const block = topicBlocks[blockIndex];
      blockOps.moveBlockUpDown(block.id, direction, groupedBlocks);
    }
  };

  const handleColumnDeleteBlock = (
    columnTopicId: string | null,
    blockIndex: number,
  ) => {
    const topicBlocks = groupedBlocks.get(columnTopicId) || [];
    if (blockIndex >= 0 && blockIndex < topicBlocks.length) {
      const block = topicBlocks[blockIndex];
      blockOps.deleteBlockById(block.id);
    }
  };

  // Block type handlers
  const handleBlockTypeSelect = (blockType: Block["type"]) => {
    modalOperations.handleBlockTypeSelect(
      blockType,
      (type, topicGroupId) => {
        const block = blockOps.createNewBlock(type, topicGroupId);
        blockOperations.addBlock(block);
        return block;
      },
    );
  };

  const handleEditBlockTypeSelect = (newType: Block["type"]) => {
    modalOperations.handleEditBlockTypeSelect(
      newType,
      blockOps.changeBlockType,
    );
  };

  return (
    <div className="kanban-board">
      {/* Topic Group Manager */}
      <TopicGroupManager
        meetingId={meetingId}
        topicGroups={meeting.topicGroups || []}
        onCreateTopic={(name: string, color?: string) =>
          topicOperations.createTopicGroup(meetingId, name, color)}
        onUpdateTopic={topicOperations.updateTopicGroup}
        onDeleteTopic={(topicGroupId: string) =>
          topicOperations.deleteTopicGroup(meetingId, topicGroupId)}
        onSwapTopic={topicOperations.swapTopicGroups
          ? (topicGroupId: string, direction: "left" | "right") =>
            topicOperations.swapTopicGroups!(meetingId, topicGroupId, direction)
          : undefined}
        onTopicGroupSelect={scrollToTopic}
      />

      {/* Kanban Board with Drag & Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={dragDropOperations.handleDragStart}
        onDragOver={dragDropOperations.handleDragOver}
        onDragEnd={dragDropOperations.handleDragEnd}
      >
        <div
          ref={scrollContainerRef}
          className="kanban-board-container"
          style={{
            display: "flex",
            gap: "1rem",
            overflowX: "auto",
            padding: "1rem 0",
            minHeight: "60vh",
          }}
        >
          {allTopicIds.map((topicId) => {
            const topicGroup = topicId
              ? topicGroups.find((tg) => tg.id === topicId)
              : null;
            const blocks = groupedBlocks.get(topicId) || [];

            return (
              <EnhancedTopicColumn
                key={topicId || "default"}
                topicGroup={topicGroup}
                blocks={blocks}
                topicId={topicId || "default"}
                onBlockChange={(index, block) =>
                  handleColumnBlockChange(topicId, index, block)}
                onMoveBlock={(index, direction) =>
                  handleColumnMoveBlock(topicId, index, direction)}
                onDeleteBlock={(index) =>
                  handleColumnDeleteBlock(topicId, index)}
                onAddBlock={() =>
                  modalOperations.openModalForNewBlock(topicId || undefined)}
                onRequestTypeChange={modalOperations.openModalForEditBlock}
                newlyCreatedBlockId={newlyCreatedBlockId}
                data-topic-group-id={topicId || "default"}
              />
            );
          })}
        </div>

        <DragOverlay>
          {dragDropOperations.activeBlock && (
            <div
              style={{
                transform: "rotate(5deg)",
                opacity: 0.9,
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                background: "white",
                borderRadius: "8px",
                border: "2px solid #007bff",
                padding: "0.5rem",
                maxWidth: "300px",
              }}
            >
              <UniversalBlock
                block={dragDropOperations.activeBlock.block}
                index={dragDropOperations.activeBlock.index}
                onChange={() => {}} // No-op for preview
                onMoveUp={() => {}} // No-op for preview
                onMoveDown={() => {}} // No-op for preview
                onDelete={() => {}} // No-op for preview
                canMoveUp={false}
                canMoveDown={false}
                shouldFocus={false}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Block Type Selection Modal */}
      <BlockTypeModal
        isOpen={modalOperations.showBlockTypeModal}
        onClose={modalOperations.closeModal}
        onSelectType={modalOperations.editBlockTypeContext
          ? handleEditBlockTypeSelect
          : handleBlockTypeSelect}
        topicGroupName={modalOperations.getTopicGroupName(topicGroups)}
      />
    </div>
  );
};
