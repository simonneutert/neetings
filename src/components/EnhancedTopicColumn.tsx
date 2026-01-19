import { FunctionalComponent, JSX } from "preact";
import { memo } from "preact/compat";
import { useMemo } from "preact/hooks";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Block } from "../types/Block";
import { TopicGroup } from "../types/TopicGroup";
import { EnhancedSortableBlock } from "./EnhancedSortableBlock";
import { getTopicGroupLightBackground } from "../utils/colors";
import { useTranslation } from "../i18n";
import { sortBySortKey } from "../utils/sortKeys";

interface EnhancedTopicColumnProps extends JSX.HTMLAttributes<HTMLDivElement> {
  topicGroup: TopicGroup | null;
  blocks: Block[];
  topicId: string;
  onBlockChange: (index: number, updatedBlock: Block) => void;
  onMoveBlock: (index: number, direction: "up" | "down") => void;
  onDeleteBlock: (index: number) => void;
  onAddBlock: (topicGroupId?: string) => void;
  newlyCreatedBlockId: string | null;
  children?: JSX.Element;
  onRequestTypeChange?: (block: Block, index: number, topicId: string) => void;
}

const EnhancedTopicColumnComponent: FunctionalComponent<
  EnhancedTopicColumnProps
> = ({
  topicGroup,
  blocks,
  topicId,
  onBlockChange,
  onMoveBlock,
  onDeleteBlock,
  onAddBlock,
  newlyCreatedBlockId,
  children,
  onRequestTypeChange,
  ...rest
}) => {
  const { t } = useTranslation();

  // Droppable for accepting blocks from other columns
  const { setNodeRef, isOver } = useDroppable({
    id: topicId,
    data: {
      type: "column",
      topicId,
    },
  });

  const isDefaultColumn = !topicGroup;
  const columnTitle = topicGroup?.name || t("topics.labels.mainAgenda");
  const columnColor = topicGroup?.color || "#6c757d";
  const lightBackground = columnColor
    ? getTopicGroupLightBackground(columnColor)
    : "#f8f9fa";

  // Sort blocks by sort key - blocks are already clean from KanbanBoard
  const sortedBlocks = useMemo(() => {
    return sortBySortKey(blocks);
  }, [blocks]);

  return (
    <div
      ref={setNodeRef}
      {...rest}
      className={`enhanced-topic-column ${isOver ? "drop-zone-active" : ""} ${
        rest.className || ""
      }`}
      style={{
        flex: "1",
        minWidth: "300px",
        maxWidth: "400px",
        backgroundColor: lightBackground,
        border: isOver
          ? `2px dashed ${columnColor}`
          : `1px solid ${columnColor}`,
        borderRadius: "8px",
        padding: "1rem",
        margin: "0.5rem",
        transition: "all 0.2s ease",
        boxShadow: isOver
          ? `0 4px 12px ${columnColor}20`
          : "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      {/* Column Header */}
      <div
        style={{
          borderBottom: `3px solid ${columnColor}`,
          marginBottom: "1rem",
          paddingBottom: "0.5rem",
        }}
      >
        <h5
          style={{
            margin: 0,
            color: columnColor,
            fontSize: "1.1rem",
            fontWeight: "600",
          }}
        >
          {columnTitle}
        </h5>
        <small style={{ color: "#6c757d" }}>
          {t("topics.blockCount", { count: sortedBlocks.length })}
        </small>
      </div>

      {children && (
        <div style={{ marginBottom: "1rem" }}>
          {children}
        </div>
      )}

      {/* Enhanced Sortable Blocks */}
      <div style={{ marginBottom: "1rem" }}>
        {sortedBlocks.length === 0
          ? (
            <div
              style={{
                padding: "2rem 1rem",
                textAlign: "center",
                color: "#6c757d",
                fontStyle: "italic",
                border: "2px dashed #dee2e6",
                borderRadius: "5px",
              }}
            >
              {isDefaultColumn
                ? t("topics.emptyDefaultColumn")
                : t("topics.emptyTopicColumn")}
            </div>
          )
          : (
            <SortableContext
              items={sortedBlocks.map((block) =>
                `block-${block.id}-${topicId}`
              )}
              strategy={verticalListSortingStrategy}
            >
              {sortedBlocks.map((block, index) => (
                <EnhancedSortableBlock
                  key={`block-${block.id}-${topicId}`}
                  block={block}
                  index={index}
                  topicId={topicId}
                  showDropIndicators={false}
                  dragOverIndex={null}
                  dragOverPosition={null}
                  onChange={(updatedBlock) =>
                    onBlockChange(index, updatedBlock)}
                  onMoveUp={() => onMoveBlock(index, "up")}
                  onMoveDown={() => onMoveBlock(index, "down")}
                  onDelete={() => onDeleteBlock(index)}
                  canMoveUp={index > 0}
                  canMoveDown={index < sortedBlocks.length - 1}
                  shouldFocus={block.id === newlyCreatedBlockId}
                  onRequestTypeChange={onRequestTypeChange
                    ? (b) => onRequestTypeChange(b, index, topicId)
                    : undefined}
                />
              ))}
            </SortableContext>
          )}
      </div>

      {/* Drop zone for end-of-column drops */}
      <div style={{ minHeight: "2rem" }} />

      {/* Quick Add Block Button */}
      <button
        className="btn btn-outline-primary w-100"
        onClick={() => onAddBlock(topicGroup?.id)}
        style={{
          fontSize: "0.9rem",
          padding: "0.5rem",
          borderStyle: "dashed",
        }}
      >
        {t("topics.addBlockButton")}
        {topicGroup && (
          <small style={{ display: "block", fontSize: "0.7rem", opacity: 0.8 }}>
            {t("topics.addBlockTo", { topicName: topicGroup.name })}
          </small>
        )}
      </button>
    </div>
  );
};

export const EnhancedTopicColumn = memo(EnhancedTopicColumnComponent);
