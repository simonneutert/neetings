import { FunctionalComponent } from "preact";
import { useTranslation } from "../i18n/index";

interface CTASectionProps {
  onButtonClick: () => void;
  show?: boolean;
}

export const CTASection: FunctionalComponent<CTASectionProps> = ({
  onButtonClick,
  show = true,
}) => {
  const { t } = useTranslation();

  if (!show) {
    return null;
  }

  return (
    <div
      className="card text-center"
      style={{
        background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
        color: "white",
        border: "none",
        marginTop: "3rem",
        boxShadow: "0 8px 32px rgba(40, 167, 69, 0.3)",
      }}
    >
      <div className="card-body" style={{ padding: "2rem" }}>
        <h3
          style={{
            fontSize: "1.6rem",
            marginBottom: "1rem",
            fontWeight: "600",
          }}
        >
          {t("cta.title")}
        </h3>
        <p
          style={{
            fontSize: "1.1rem",
            marginBottom: "1.5rem",
            opacity: "0.95",
          }}
        >
          {t("cta.description")}
        </p>
        <button
          className="btn btn-light btn-lg text-success"
          onClick={onButtonClick}
          style={{
            fontWeight: "600",
            padding: "0.75rem 2rem",
            fontSize: "1.1rem",
            boxShadow: "0 4px 16px rgba(255,255,255,0.3)",
          }}
        >
          {t("cta.button")}
        </button>
      </div>
    </div>
  );
};
