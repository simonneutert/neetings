import { FunctionalComponent, JSX } from "preact"; // Added JSX, removed ComponentChildren
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Block } from "../types/Block";
import { TopicGroup } from "../types/TopicGroup";
import { DraggableBlock } from "./DraggableBlock";
import { getTopicGroupLightBackground } from "../utils/colors";
import { useTranslation } from "../i18n";

interface TopicColumnProps extends JSX.HTMLAttributes<HTMLDivElement> { // Extend with HTMLAttributes
  topicGroup: TopicGroup | null; // null represents "ungrouped" column
  blocks: Block[];
  onBlockChange: (index: number, updatedBlock: Block) => void;
  onMoveBlock: (index: number, direction: "up" | "down") => void;
  onDeleteBlock: (index: number) => void;
  onAddBlock: (topicGroupId?: string) => void;
  newlyCreatedBlockId: string | null;
  topicId: string; // Add this for drag & drop identification
  // children is already part of HTMLAttributes, but can be kept for clarity if preferred
}

export const TopicColumn: FunctionalComponent<TopicColumnProps> = ({
  topicGroup,
  blocks,
  onBlockChange,
  onMoveBlock,
  onDeleteBlock,
  onAddBlock,
  newlyCreatedBlockId,
  topicId,
  children,
  ...rest // Collect rest of the props
}) => {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({
    id: topicId,
  });

  const isDefaultColumn = !topicGroup;
  const columnTitle = topicGroup?.name || t("topics.labels.mainAgenda");
  const columnColor = topicGroup?.color || "#6c757d";
  const lightBackground = columnColor
    ? getTopicGroupLightBackground(columnColor)
    : "#f8f9fa";
  const hoverBackground = columnColor
    ? getTopicGroupLightBackground(columnColor)
    : "#e3f2fd";

  return (
    <div
      ref={setNodeRef}
      {...rest}
      // Spread the rest of the props here
      className={`kanban-column ${isOver ? "drop-zone-active" : ""} ${
        rest.className || ""
      }`.trim()} // Combine classNames
      style={{
        flex: "1",
        minWidth: "65vb", // Changed from 400px
        maxWidth: "80vb", // Changed from 500px
        backgroundColor: isOver ? hoverBackground : lightBackground,
        borderRadius: "8px",
        padding: "1rem",
        margin: "0 0.5rem",
        border: isOver
          ? `2px dashed ${columnColor}`
          : `1px solid ${columnColor}`,
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
          {t("topics.blockCount", { count: blocks.length })}
        </small>
      </div>

      {/* Additional Controls */}
      {children && (
        <div style={{ marginBottom: "1rem" }}>
          {children}
        </div>
      )}

      {/* Blocks */}
      <div style={{ marginBottom: "1rem" }}>
        {blocks.length === 0
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
              items={blocks.map((block) => `block-${block.id}-${topicId}`)}
              strategy={verticalListSortingStrategy}
            >
              {blocks.map((block, index) => (
                <DraggableBlock
                  key={block.id || index}
                  block={block}
                  index={index} // Keep using local index for column operations
                  topicId={topicId}
                  onChange={(updatedBlock) =>
                    onBlockChange(index, updatedBlock)}
                  onMoveUp={() => onMoveBlock(index, "up")}
                  onMoveDown={() => onMoveBlock(index, "down")}
                  onDelete={() => onDeleteBlock(index)}
                  canMoveUp={index > 0}
                  canMoveDown={index < blocks.length - 1}
                  shouldFocus={block.id ===
                    newlyCreatedBlockId}
                />
              ))}
            </SortableContext>
          )}
      </div>

      {/* Quick Add Block Button */}
      <button
        class="btn btn-outline-primary w-100"
        onClick={() => onAddBlock(topicGroup?.id)}
        style={{
          fontSize: "0.9rem",
          padding: "0.5rem",
          borderStyle: "dashed",
        }}
      >
        {t("topics.addBlockButton")}
        {topicGroup && (
          <small
            style={{
              display: "block",
              fontSize: "0.7rem",
              opacity: 0.8,
            }}
          >
            {t("topics.addBlockTo", { topicName: topicGroup.name })}
          </small>
        )}
      </button>
    </div>
  );
};
