import { FunctionalComponent } from "preact";
import { useTranslation } from "../i18n/index";
import { CTASection } from "./CTASection";

interface ImprintProps {
  onBackToMeetings: () => void;
  hasMeetings?: boolean;
}

export const Imprint: FunctionalComponent<ImprintProps> = (
  { onBackToMeetings, hasMeetings = false },
) => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        margin: "2rem 0",
        maxWidth: "800px",
        marginLeft: "auto",
        marginRight: "auto",
        scrollBehavior: "smooth",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        {hasMeetings && (
          <button
            className="btn btn-outline-secondary mb-3"
            onClick={onBackToMeetings}
            style={{ fontSize: "0.9rem" }}
          >
            {t("common.backToMeetings")}
          </button>
        )}

        <h1
          class="text-primary"
          style={{
            fontSize: "2.5rem",
            fontWeight: "bold",
            marginBottom: "1rem",
          }}
        >
          {t("imprint.title")}
        </h1>
      </div>

      {/* Legal Notice Section */}
      <div
        className="card"
        style={{
          borderRadius: "12px",
          border: "1px solid var(--bs-border-color-translucent)",
          marginBottom: "2rem",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div className="card-body" style={{ padding: "2rem" }}>
          <h2
            className="card-title text-primary"
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              marginBottom: "1.5rem",
            }}
          >
            {t("imprint.legalNotice")}
          </h2>

          <div style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>
            <p style={{ marginBottom: "0.5rem", fontWeight: "500" }}>
              {t("imprint.name")}
            </p>
            <p style={{ marginBottom: "0" }}>
              {t("imprint.address")}
            </p>
          </div>
        </div>
      </div>

      {/* EU Dispute Resolution Section */}
      <div
        className="card"
        style={{
          borderRadius: "12px",
          border: "1px solid var(--bs-border-color-translucent)",
          marginBottom: "2rem",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div className="card-body" style={{ padding: "2rem" }}>
          <h2
            className="card-title text-primary"
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              marginBottom: "1.5rem",
            }}
          >
            {t("imprint.euDispute.title")}
          </h2>

          <div style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>
            <p style={{ marginBottom: "1rem" }}>
              {t("imprint.euDispute.text")}
            </p>
            <p style={{ marginBottom: "1rem" }}>
              <a
                href={t("imprint.euDispute.linkUrl")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary"
                style={{
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                {t("imprint.euDispute.linkText")}
              </a>
            </p>
            <p style={{ marginBottom: "0" }}>
              {t("imprint.euDispute.emailNote")}
            </p>
          </div>
        </div>
      </div>

      {/* Consumer Dispute Resolution Section */}
      <div
        className="card"
        style={{
          borderRadius: "12px",
          border: "1px solid var(--bs-border-color-translucent)",
          marginBottom: "2rem",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div className="card-body" style={{ padding: "2rem" }}>
          <h2
            className="card-title text-primary"
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              marginBottom: "1.5rem",
            }}
          >
            {t("imprint.consumerDispute.title")}
          </h2>

          <div style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>
            <p style={{ marginBottom: "0" }}>
              {t("imprint.consumerDispute.text")}
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <CTASection
        onButtonClick={onBackToMeetings}
        show={!hasMeetings}
      />
    </div>
  );
};
