import { FunctionalComponent } from "preact";
import { Block, BLOCK_TYPES, createBlock } from "../types/Block";
import { APP_CONFIG } from "../constants/index";
import { getSemanticColorHex } from "../utils/colors";
import { useTranslation } from "../i18n/index";

interface BlockCreatorProps {
  onAddBlock: (block: Block) => void;
}

export const BlockCreator: FunctionalComponent<BlockCreatorProps> = (
  { onAddBlock },
) => {
  const { t } = useTranslation();

  const handleAddBlock = (type: Block["type"]) => {
    const newBlock = createBlock(type);
    onAddBlock(newBlock);

    // Scroll to bottom after adding
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }
    }, APP_CONFIG.SCROLL_DELAY);
  };

  return (
    <div class="mb-4">
      <h6 class="mb-3">{t("blocks.creator.title")}</h6>
      <div
        class="btn-group"
        role="group"
        style={{ flexWrap: "wrap", gap: "0.5rem" }}
      >
        {(Object.entries(BLOCK_TYPES) as [
          Block["type"],
          typeof BLOCK_TYPES[Block["type"]],
        ][]).map(([type, config]) => {
          const backgroundColor = getSemanticColorHex(config.color);
          const isLightColor = config.color.includes("light") ||
            config.color === "idea-medium";
          const textColor = isLightColor ? "#000" : "#fff";
          const translatedLabel = t(`blocks.types.${type}`);

          return (
            <button
              key={type}
              class="btn"
              onClick={() => handleAddBlock(type)}
              style={{
                cursor: "pointer",
                marginBottom: "0.5rem",
                backgroundColor,
                color: textColor,
                border: `1px solid ${backgroundColor}`,
                "--bs-btn-hover-bg": backgroundColor,
                "--bs-btn-hover-border-color": backgroundColor,
                "--bs-btn-active-bg": backgroundColor,
                "--bs-btn-active-border-color": backgroundColor,
              }}
            >
              + {translatedLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
};
