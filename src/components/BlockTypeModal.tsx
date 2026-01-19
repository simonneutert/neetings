import { FunctionalComponent } from "preact";
import { useCallback, useEffect } from "preact/hooks";
import { Block, BLOCK_TYPES } from "../types/Block";
import { getSemanticColorHex } from "../utils/colors";
import { useTranslation } from "../i18n/index";

interface BlockTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: Block["type"]) => void;
  topicGroupName?: string;
}

export const BlockTypeModal: FunctionalComponent<BlockTypeModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
  topicGroupName,
}) => {
  const { t } = useTranslation();
  const handleSelectType = useCallback((type: Block["type"]) => {
    onSelectType(type);
    onClose();
  }, [onSelectType, onClose]);

  // Handle escape key and number shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }

      // Number shortcuts for quick selection (1-9)
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        const blockTypes = Object.keys(BLOCK_TYPES) as Block["type"][];
        if (blockTypes[num - 1]) {
          handleSelectType(blockTypes[num - 1]);
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, handleSelectType]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: Event) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={handleBackdropClick}
      data-testid="modal-backdrop"
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "1.5rem",
          maxWidth: "900px", // Increased width for three columns
          width: "95%",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          animation: "slideUp 0.3s ease-out",
          border: "1px solid #e9ecef",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            borderBottom: "1px solid #dee2e6",
            paddingBottom: "1rem",
          }}
        >
          <h5 style={{ margin: 0 }}>
            {t("blocks.modal.title")}
            {topicGroupName && (
              <small
                style={{
                  display: "block",
                  color: "#6c757d",
                  fontSize: "0.8rem",
                  fontWeight: "normal",
                }}
              >
                {t("blocks.modal.addingTo", { topicName: topicGroupName })}
              </small>
            )}
          </h5>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: "0.25rem",
            }}
            title={t("common.close")}
          >
            ×
          </button>
        </div>

        {/* Block Types List */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {(Object.entries(BLOCK_TYPES) as [
            Block["type"],
            typeof BLOCK_TYPES[Block["type"]],
          ][]).map(([type, config], index) => {
            const backgroundColor = getSemanticColorHex(config.color);
            const isLightColor = config.color.includes("light") ||
              config.color === "idea-medium";
            const textColor = isLightColor ? "#000" : "#fff";
            const shortcutNumber = index + 1;

            return (
              <button
                key={type}
                onClick={() => handleSelectType(type)}
                style={{
                  padding: "1rem",
                  border: `2px solid ${backgroundColor}`,
                  borderRadius: "8px",
                  backgroundColor: `${backgroundColor}20`, // Light background
                  color: "#333",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  fontSize: "0.85rem",
                  position: "relative",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  minHeight: "80px",
                  justifyContent: "space-between",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = backgroundColor;
                  e.currentTarget.style.color = textColor;
                  // Add button text also changes color
                  const textElement = e.currentTarget.querySelector(
                    ".block-type-text",
                  ) as HTMLElement;
                  if (textElement) textElement.style.color = textColor;
                  const descElement = e.currentTarget.querySelector(
                    ".block-type-description",
                  ) as HTMLElement;
                  if (descElement) descElement.style.color = textColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    `${backgroundColor}20`;
                  e.currentTarget.style.color = "#333";
                  const textElement = e.currentTarget.querySelector(
                    ".block-type-text",
                  ) as HTMLElement;
                  if (textElement) textElement.style.color = "#333";
                  const descElement = e.currentTarget.querySelector(
                    ".block-type-description",
                  ) as HTMLElement;
                  if (descElement) descElement.style.color = "#6c757d";
                }}
              >
                {/* Keyboard shortcut indicator */}
                {shortcutNumber <= 9 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "0.25rem",
                      right: "0.5rem",
                      fontSize: "0.7rem",
                      fontWeight: "bold",
                      opacity: 0.6,
                    }}
                  >
                    {shortcutNumber}
                  </div>
                )}
                <div>
                  <strong
                    className="block-type-text"
                    style={{
                      fontSize: "1rem",
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {t(`blocks.types.${type}`)}
                  </strong>
                  <p
                    className="block-type-description"
                    style={{ fontSize: "0.75rem", margin: 0, color: "#6c757d" }}
                  >
                    {t(`blocks.modal.descriptions.${type}`)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Footer (Tip and Cancel Button) */}
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1rem",
            borderTop: "1px solid #dee2e6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <small style={{ color: "#6c757d", fontStyle: "italic" }}>
            {t("blocks.modal.tip")}
          </small>
          <button
            className="btn btn-outline-secondary"
            onClick={onClose}
            style={{ padding: "0.5rem 1rem" }}
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
};
