import { FunctionalComponent } from "preact";
import { memo } from "preact/compat";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Block } from "../types/Block";
import { UniversalBlock } from "./UniversalBlock";
import { DropIndicator } from "./DropIndicator";

interface EnhancedSortableBlockProps {
  block: Block;
  index: number;
  topicId: string;
  onChange: (updatedBlock: Block) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  shouldFocus?: boolean;
  showDropIndicators?: boolean;
  dragOverIndex?: number | null;
  dragOverPosition?: "top" | "bottom" | null;
  onRequestTypeChange?: (block: Block) => void;
}

const EnhancedSortableBlockComponent: FunctionalComponent<
  EnhancedSortableBlockProps
> = ({
  block,
  index,
  topicId,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp,
  canMoveDown,
  shouldFocus = false,
  showDropIndicators = false,
  dragOverIndex = null,
  dragOverPosition = null,
  onRequestTypeChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: `block-${block.id}-${topicId}`,
    data: {
      type: "block",
      blockIndex: index,
      fromTopicId: topicId === "default" ? null : topicId,
      block,
      globalBlockId: block.id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={{ position: "relative", ...style }}>
      {/* Top drop indicator */}
      <DropIndicator
        isVisible={showDropIndicators && dragOverIndex === index &&
          dragOverPosition === "top"}
        position="top"
        index={index}
      />

      {/* Block content */}
      <div
        className={`enhanced-sortable-block ${isDragging ? "dragging" : ""} ${
          isOver ? "drag-over" : ""
        }`}
        style={{
          position: "relative",
          backgroundColor: isDragging
            ? "var(--bs-primary-bg-subtle)"
            : "var(--bs-body-bg)",
          borderRadius: "8px",
          transition: "all 0.2s ease",
        }}
      >
        {/* Drag handle */}
        <div
          {...listeners}
          tabIndex={attributes.tabIndex}
          role="button"
          aria-describedby={attributes["aria-describedby"]}
          className="drag-handle"
          style={{
            position: "absolute",
            top: "0.5rem",
            left: "0.5rem",
            cursor: isDragging ? "grabbing" : "grab",
            padding: "0.5rem",
            borderRadius: "6px",
            backgroundColor: isDragging
              ? "var(--bs-primary-bg-subtle)"
              : "var(--bs-secondary-bg)",
            color: "var(--bs-body-color)",
            fontSize: "1rem",
            zIndex: 10,
            minWidth: "2rem",
            minHeight: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            touchAction: "none",
          }}
          title="Drag to move or reorder block"
        >
          ⋮⋮
        </div>

        {/* Block content with padding for drag handle */}
        <div style={{ paddingLeft: "3rem" }}>
          <UniversalBlock
            block={block}
            index={index}
            onChange={onChange}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onDelete={onDelete}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            shouldFocus={shouldFocus}
            onRequestTypeChange={onRequestTypeChange}
          />
        </div>
      </div>

      {/* Bottom drop indicator */}
      <DropIndicator
        isVisible={showDropIndicators && dragOverIndex === index &&
          dragOverPosition === "bottom"}
        position="bottom"
        index={index}
      />
    </div>
  );
};

export const EnhancedSortableBlock = memo(EnhancedSortableBlockComponent);
