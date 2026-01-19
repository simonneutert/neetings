import { FunctionalComponent } from "preact";
import { useState } from "preact/hooks";
import { useTranslation } from "../i18n/index";

interface EnhancedDownloadButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const EnhancedDownloadButton: FunctionalComponent<
  EnhancedDownloadButtonProps
> = ({
  onClick,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className="enhanced-download-btn mt-2 mb-4"
      onClick={onClick}
      disabled={disabled}
      title={t("importExport.actions.exportMeeting")}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
        color: "white",
        border: "2px solid rgba(255,255,255,0.2)",
        padding: "0.75rem 1.5rem",
        borderRadius: "12px",
        fontSize: "1rem",
        fontWeight: "600",
        boxShadow: isHovered
          ? "0 6px 20px rgba(139, 92, 246, 0.4)"
          : "0 4px 12px rgba(139, 92, 246, 0.3)",
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
      {/* Icon */}
      <span style={{ fontSize: "1.1em" }}>📥</span>

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
        {t("importExport.actions.exportButtonText")}
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
