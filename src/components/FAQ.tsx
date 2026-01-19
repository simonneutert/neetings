import { FunctionalComponent } from "preact";
import { useTranslation } from "../i18n/index";
import { CTASection } from "./CTASection";

interface FAQProps {
  onBackToMeetings: () => void;
  hasMeetings?: boolean;
}

export const FAQ: FunctionalComponent<FAQProps> = (
  { onBackToMeetings, hasMeetings = false },
) => {
  const { t } = useTranslation();

  const orderedQuestions = [
    "whyChoose",
    "security",
    "quickStart",
    "blockSystem",
    "organization",
    "attendees",
    "teamSize",
    "dataPortability",
    "confluence",
  ];

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
            marginBottom: "0.5rem",
          }}
        >
          {t("faq.title")}
        </h1>

        <p
          class="text-muted"
          style={{
            fontSize: "1.1rem",
            marginBottom: "0",
          }}
        >
          {t("faq.subtitle")}
        </p>
      </div>

      {/* Table of Contents */}
      <div
        className="card mb-4 bg-body-secondary border shadow-sm"
        style={{
          borderRadius: "12px",
          transition: "all 0.2s ease",
          borderColor: "var(--bs-border-color-translucent)",
        }}
      >
        <div className="card-body" style={{ padding: "1.5rem" }}>
          <h4
            class="text-primary"
            style={{
              fontSize: "1.1rem",
              fontWeight: "600",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            📋 {t("faq.tableOfContents")}
          </h4>
          <ol
            style={{
              margin: "0",
              paddingLeft: "1.2rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {orderedQuestions.map((questionKey) => (
              <li key={questionKey} style={{ fontSize: "0.95rem" }}>
                <a
                  href={`#faq-${questionKey}`}
                  class="text-primary text-decoration-none"
                  style={{
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.textDecoration = "underline";
                    e.currentTarget.style.opacity = "0.8";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.textDecoration = "none";
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  {t(`faq.questions.${questionKey}.question`).replace(
                    /🔗\s*/u,
                    "",
                  ).replace(/[📋✨🚀]/gu, "").trim()}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* FAQ Items */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          scrollBehavior: "smooth",
        }}
      >
        {orderedQuestions.map((questionKey, index) => (
          <div
            key={questionKey}
            id={`faq-${questionKey}`}
            className="card bg-body border shadow-sm"
            style={{
              borderRadius: "12px",
              overflow: "hidden",
              transition: "all 0.2s ease",
              borderColor: "var(--bs-border-color-translucent)",
            }}
            onMouseOver={(e) => {
              const card = e.currentTarget as HTMLElement;
              card.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
              card.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              const card = e.currentTarget as HTMLElement;
              card.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
              card.style.transform = "translateY(0)";
            }}
          >
            <div className="card-body" style={{ padding: "1.5rem" }}>
              <h5
                class="text-primary"
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span
                  className="badge bg-primary"
                  style={{
                    fontSize: "0.7rem",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "50%",
                    minWidth: "1.5rem",
                    textAlign: "center",
                  }}
                >
                  {index + 1}
                </span>
                {t(`faq.questions.${questionKey}.question`)}
              </h5>

              <p
                class="text-body"
                style={{
                  fontSize: "1rem",
                  lineHeight: "1.6",
                  marginBottom: "0",
                }}
              >
                {t(`faq.questions.${questionKey}.answer`)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Call to Action - Only show when no meetings exist */}
      <CTASection
        onButtonClick={onBackToMeetings}
        show={!hasMeetings}
      />
    </div>
  );
};
