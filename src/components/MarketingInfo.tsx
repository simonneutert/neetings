import { FunctionalComponent } from "preact";
import { useTranslation } from "../i18n/index";

interface MarketingInfoProps {
  variant?: "hero" | "footer";
  onTermsClick?: () => void;
  onImprintClick?: () => void;
}

export const MarketingInfo: FunctionalComponent<MarketingInfoProps> = ({
  variant = "hero",
  onTermsClick,
  onImprintClick,
}) => {
  const { t } = useTranslation();

  const baseStyle = {
    textAlign: "center" as const,
    fontSize: "0.875rem",
    color: "#6c757d",
  };

  const heroStyle = {
    ...baseStyle,
    marginTop: "2rem",
    padding: "1rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "0.5rem",
    border: "1px solid #dee2e6",
  };

  const footerStyle = {
    ...baseStyle,
    marginTop: "1rem",
    paddingTop: "1rem",
    borderTop: "1px solid #e9ecef",
  };

  const linkStyle = {
    color: "#0d6efd",
    textDecoration: "none",
    cursor: "pointer",
  };

  return (
    <div style={variant === "hero" ? heroStyle : footerStyle}>
      <div>
        🔒 {t("marketing.noCookies")} • 🛡️ {t("marketing.noDataTransfer")}
      </div>
      <div style={{ marginTop: "0.5rem" }}>
        <a
          style={linkStyle}
          onClick={(e) => {
            e.preventDefault();
            if (onTermsClick) onTermsClick();
          }}
          href="#"
        >
          {t("marketing.termsOfService")}
        </a>
        {onImprintClick && (
          <>
            {" • "}
            <a
              style={linkStyle}
              onClick={(e) => {
                e.preventDefault();
                if (onImprintClick) onImprintClick();
              }}
              href="#"
            >
              {t("imprint.title")}
            </a>
          </>
        )}
      </div>
    </div>
  );
};
