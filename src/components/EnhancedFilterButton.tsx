import { FunctionalComponent } from "preact";
import { useState } from "preact/hooks";
import { useTranslation } from "../i18n/index";

interface EnhancedFilterButtonProps {
  isExpanded: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const EnhancedFilterButton: FunctionalComponent<
  EnhancedFilterButtonProps
> = ({
  isExpanded,
  onToggle,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className="enhanced-filter-btn mt-2 mb-4"
      onClick={onToggle}
      disabled={disabled}
      title={isExpanded ? t("filter.hideFilters") : t("filter.showFilters")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isExpanded
          ? "linear-gradient(135deg, #fd7e14 0%, #e83e8c 100%)"
          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        border: "2px solid rgba(255,255,255,0.2)",
        padding: "0.75rem 1.5rem",
        borderRadius: "12px",
        fontSize: "1rem",
        fontWeight: "600",
        boxShadow: isHovered
          ? (isExpanded
            ? "0 6px 20px rgba(253, 126, 20, 0.4)"
            : "0 6px 20px rgba(102, 126, 234, 0.4)")
          : (isExpanded
            ? "0 4px 12px rgba(253, 126, 20, 0.3)"
            : "0 4px 12px rgba(102, 126, 234, 0.3)"),
        transform: disabled
          ? "none"
          : isHovered
          ? "translateY(-2px)"
          : "translateY(-1px)",
        transition: "all 0.2s ease",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        whiteSpace: "nowrap",
      }}
    >
      {/* Icon with rotation animation */}
      <span
        style={{
          fontSize: "1.1em",
          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease",
        }}
      >
        🔍
      </span>

      {/* Text with subtle gradient effect */}
      <span
        style={{
          background:
            "linear-gradient(45deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,1) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          fontWeight: "600",
        }}
      >
        {isExpanded ? t("filter.hideFilters") : t("filter.showFilters")}
      </span>
      {/* Shine effect */}
      <div
        style={{
          position: "absolute",
          top: "0",
          left: disabled || !isHovered ? "-100%" : "100%",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
          transition: "left 0.6s ease",
          pointerEvents: "none",
        }}
      />
    </button>
  );
};
