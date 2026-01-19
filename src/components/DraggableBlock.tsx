import { FunctionalComponent } from "preact";
import { useDraggable } from "@dnd-kit/core";
import { Block } from "../types/Block";
import { UniversalBlock } from "./UniversalBlock";

interface DraggableBlockProps {
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
}

export const DraggableBlock: FunctionalComponent<DraggableBlockProps> = ({
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
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `block-${block.id}-${index}`,
    data: {
      blockIndex: index,
      fromTopicId: topicId === "default" ? null : topicId,
      block,
      globalBlockId: block.id, // Add global block ID for safer lookups
    },
  });

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 1000 : 1,
      transition: isDragging ? "none" : "all 0.2s ease",
    }
    : {
      transition: "all 0.2s ease",
    };

  return (
    <div
      ref={setNodeRef}
      className={`kanban-block ${isDragging ? "dragging" : ""}`}
      style={style}
    >
      <div style={{ position: "relative" }}>
        {/* Drag handle - enhanced for mobile */}
        <div
          {...listeners}
          tabIndex={attributes.tabIndex}
          role={attributes.role as any}
          aria-describedby={attributes["aria-describedby"]}
          className="drag-handle"
          style={{
            position: "absolute",
            top: "0.5rem",
            left: "0.5rem",
            cursor: isDragging ? "grabbing" : "grab",
            padding: "0.5rem", // Larger touch target
            borderRadius: "6px",
            backgroundColor: isDragging
              ? "var(--bs-primary-bg-subtle)"
              : "var(--bs-secondary-bg)",
            color: "var(--bs-body-color)",
            fontSize: "1rem", // Larger for mobile
            zIndex: 10,
            minWidth: "2rem",
            minHeight: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            touchAction: "none", // Prevent scrolling on touch
          }}
          title="Drag to move block"
        >
          ⋮⋮
        </div>

        {/* Block content with left padding for drag handle */}
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
          />
        </div>
      </div>
    </div>
  );
};
