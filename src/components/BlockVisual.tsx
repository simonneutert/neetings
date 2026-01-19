import { ComponentChildren, FunctionalComponent } from "preact";
import { Block, BLOCK_TYPES } from "../types/Block";
import { getSemanticColorHex } from "../utils/colors";
import { useTranslation } from "../i18n/index";

interface BlockVisualProps {
  block: Block;
  showTodoToggle?: boolean;
  onTodoToggle?: () => void;
  children?: ComponentChildren;
  actions?: ComponentChildren;
  onBadgeClick?: () => void;
}

export const BlockVisual: FunctionalComponent<BlockVisualProps> = ({
  block,
  showTodoToggle = false,
  onTodoToggle,
  children,
  actions,
  onBadgeClick,
}) => {
  const { t } = useTranslation();
  const blockType = BLOCK_TYPES[block.type];
  const blockColor = getSemanticColorHex(blockType.color);

  // Determine text color for badge based on background color
  const isLightBackground = blockType.color === "idea-light" ||
    blockType.color === "doc-light";
  const badgeTextColor = isLightBackground ? "#000" : "#fff";

  return (
    <div
      class="bg-body"
      style={{
        padding: "0.75rem",
        border: `1px solid ${blockColor}`,
        borderRadius: "5px",
        marginBottom: "0.5rem",
        position: "relative",
      }}
    >
      {/* Action Buttons - Top Right */}
      {actions && (
        <div
          style={{
            position: "absolute",
            top: "0.5rem",
            right: "0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          {actions}
        </div>
      )}

      {/* Block Type Badge */}
      <div style={{ marginBottom: "0.5rem" }}>
        <span
          style={{
            fontSize: "0.75rem",
            backgroundColor: blockColor,
            color: badgeTextColor,
            padding: "0.25rem 0.5rem",
            borderRadius: "3px",
            fontWeight: "bold",
            cursor: onBadgeClick ? "pointer" : undefined,
            userSelect: "none",
          }}
          onClick={onBadgeClick}
          title="Change block type"
        >
          {t(`blocks.types.${block.type}`).toUpperCase()}
        </span>
      </div>

      {/* Todo Checkbox */}
      {showTodoToggle && block.type === "todoblock" && (
        <div style={{ marginBottom: "0.5rem" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
              margin: 0,
              fontSize: "0.9rem",
            }}
          >
            <input
              type="checkbox"
              checked={block.completed || false}
              onChange={onTodoToggle}
              style={{ margin: 0 }}
            />
            <span
              class={block.completed ? "text-success" : "text-muted"}
            >
              {block.completed
                ? t("blocks.status.completed")
                : t("blocks.status.pending")}
            </span>
          </label>
        </div>
      )}

      {/* Block Content */}
      {children && (
        <div style={{ marginBottom: "0.5rem" }}>
          {children}
        </div>
      )}
    </div>
  );
};
