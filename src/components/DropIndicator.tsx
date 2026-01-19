import { FunctionalComponent } from "preact";

interface DropIndicatorProps {
  isVisible: boolean;
  position: "top" | "bottom" | "between";
  index?: number;
}

export const DropIndicator: FunctionalComponent<DropIndicatorProps> = ({
  isVisible,
  position,
  index,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={`drop-indicator drop-indicator--${position}`}
      style={{
        height: "3px",
        backgroundColor: "var(--bs-primary)",
        borderRadius: "2px",
        margin: "2px 0",
        opacity: 0.8,
        transition: "all 0.2s ease",
        position: position === "between" ? "absolute" : "relative",
        zIndex: 1000,
        boxShadow: "0 0 4px var(--bs-primary-bg-subtle)",
      }}
      data-drop-index={index}
    />
  );
};
