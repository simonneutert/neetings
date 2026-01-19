import { FunctionalComponent } from "preact";
import { memo } from "preact/compat";
import { useEffect, useRef } from "preact/hooks";
import {
  Block,
  BLOCK_TYPES,
  getBlockFieldValue,
  setBlockFieldValue,
  toggleBlockCompletion,
} from "../types/Block";
import {
  APP_CONFIG,
  CONFIRM_MESSAGES,
  TEXTAREA_FIELDS,
} from "../constants/index";
import { createTodoStyle } from "../utils/styles";
import { BlockVisual } from "./BlockVisual";
import { useTranslation } from "../i18n/index";

interface UniversalBlockProps {
  block: Block;
  index: number;
  onChange: (updatedBlock: Block) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  shouldFocus?: boolean;
  onRequestTypeChange?: (block: Block) => void;
}

const UniversalBlockComponent: FunctionalComponent<UniversalBlockProps> = ({
  block,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp,
  canMoveDown,
  shouldFocus = false,
  onRequestTypeChange,
}) => {
  const { t } = useTranslation();
  const blockType = BLOCK_TYPES[block.type];
  const firstInputRef = useRef<HTMLInputElement>(null);
  const firstTextAreaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus the first input/textarea when shouldFocus is true
  useEffect(() => {
    if (shouldFocus) {
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        const elementToFocus = firstTextAreaRef.current ||
          firstInputRef.current;
        if (elementToFocus) {
          elementToFocus.focus();
        }
      });
    }
  }, [shouldFocus]);

  const handleFieldChange = (field: string, value: string) => {
    const updatedBlock = setBlockFieldValue(block, field, value);
    onChange(updatedBlock);
  };

  const handleCompletionToggle = () => {
    const updatedBlock = toggleBlockCompletion(block);
    onChange(updatedBlock);
  };

  const handleDelete = () => {
    if (window.confirm(CONFIRM_MESSAGES.DELETE_BLOCK)) {
      onDelete();
    }
  };

  const handleBadgeClick = () => {
    if (onRequestTypeChange) {
      onRequestTypeChange(block);
    } else {
      console.log("Clicked badge for block:", block);
    }
  };

  const renderField = (field: string, isFirst: boolean = false) => {
    const value = getBlockFieldValue(block, field);
    const isTextArea = TEXTAREA_FIELDS.includes(field as any);
    const todoStyle = createTodoStyle(
      block.type === "todoblock" && block.completed,
    );
    const placeholder = t(`blocks.placeholders.${field}`);

    if (isTextArea) {
      return (
        <textarea
          ref={isFirst ? firstTextAreaRef : undefined}
          class="form-control"
          placeholder={placeholder}
          value={value}
          onInput={(e) =>
            handleFieldChange(field, (e.target as HTMLTextAreaElement).value)}
          rows={APP_CONFIG.UI.TEXTAREA_ROWS}
          style={todoStyle}
        />
      );
    }

    return (
      <input
        ref={isFirst ? firstInputRef : undefined}
        class="form-control"
        type="text"
        placeholder={placeholder}
        value={value}
        onInput={(e) =>
          handleFieldChange(field, (e.target as HTMLInputElement).value)}
        style={todoStyle}
      />
    );
  };

  return (
    <BlockVisual
      block={block}
      showTodoToggle={true}
      onTodoToggle={handleCompletionToggle}
      actions={
        <>
          <button
            class="btn btn-xs btn-outline-secondary"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            title={t("blocks.actions.moveUp")}
            style={{ fontSize: "0.7rem", padding: "0.1rem 0.3rem" }}
          >
            ↑
          </button>
          <button
            class="btn btn-xs btn-outline-secondary"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            title={t("blocks.actions.moveDown")}
            style={{ fontSize: "0.7rem", padding: "0.1rem 0.3rem" }}
          >
            ↓
          </button>
          <button
            class="btn btn-xs btn-outline-danger"
            onClick={handleDelete}
            title={t("blocks.actions.delete")}
            style={{ fontSize: "0.7rem", padding: "0.1rem 0.3rem" }}
          >
            🗑️
          </button>
        </>
      }
      onBadgeClick={handleBadgeClick}
    >
      {blockType.fields.map((field, index) => (
        <div key={field} class="mb-2">
          {blockType.fields.length > 1 && (
            <label class="form-label text-capitalize">
              {t(`blocks.fields.${field}`)}
            </label>
          )}
          {renderField(field, index === 0)}
        </div>
      ))}
    </BlockVisual>
  );
};

export const UniversalBlock = memo(UniversalBlockComponent);
