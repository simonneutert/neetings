import { useTranslation } from "../i18n/index";

interface ProductionReadyHintProps {
  color?: string;
}

export function ProductionReadyHint(
  { color = "linear-gradient(135deg, #fd7e14 0%, #e83e8c 100%)" }:
    ProductionReadyHintProps,
) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        marginTop: "20px",
        marginBottom: "20px",
        background: color,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        fontSize: "16px",
        fontWeight: "500",
        textAlign: "center",
      }}
    >
      <a
        href="https://github.com/simonneutert/neetings-feedback-public-alpha/discussions"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("featureFlag.notProductionReady")}
      </a>
    </div>
  );
}
