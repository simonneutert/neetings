import { FunctionalComponent } from "preact";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Block } from "../types/Block";
import { UniversalBlock } from "./UniversalBlock";

interface SortableBlockProps {
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

export const SortableBlock: FunctionalComponent<SortableBlockProps> = ({
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
    transition,
    isDragging,
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
    <div
      ref={setNodeRef}
      style={style}
      className={`sortable-block ${isDragging ? "dragging" : ""}`}
    >
      <div style={{ position: "relative" }}>
        {/* Drag handle - enhanced for mobile */}
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
