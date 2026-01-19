import { FunctionalComponent } from "preact";
import { useTranslation } from "../i18n/index";

interface TermsOfServiceProps {
  onBackToMeetings?: () => void;
  hasMeetings?: boolean;
}

export const TermsOfService: FunctionalComponent<TermsOfServiceProps> = ({
  onBackToMeetings,
  hasMeetings = false,
}) => {
  const { t } = useTranslation();

  return (
    <div style={{ margin: "2rem auto", maxWidth: "800px", padding: "0 1rem" }}>
      {/* Header with optional back button */}
      <div style={{ marginBottom: "2rem" }}>
        {hasMeetings && onBackToMeetings && (
          <button
            className="btn btn-outline-secondary mb-3"
            onClick={onBackToMeetings}
            style={{ fontSize: "0.9rem" }}
          >
            ← Back to Meetings
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: "2rem" }}>
          <h2 style={{ marginBottom: "1.5rem" }}>
            {t("terms.title")}
          </h2>

          <div style={{ lineHeight: "1.6", color: "#495057" }}>
            <section style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
                {t("terms.serviceAvailability.title")}
              </h3>
              <p>{t("terms.serviceAvailability.content")}</p>
            </section>

            <section style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
                {t("terms.asIs.title")}
              </h3>
              <p>{t("terms.asIs.content")}</p>
            </section>

            <section style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
                {t("terms.noSupport.title")}
              </h3>
              <p>{t("terms.noSupport.content")}</p>
            </section>

            <section style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
                {t("terms.userResponsibility.title")}
              </h3>
              <p>{t("terms.userResponsibility.content")}</p>
            </section>

            <section style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
                {t("terms.liability.title")}
              </h3>
              <p>{t("terms.liability.content")}</p>
            </section>

            <section style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
                {t("terms.dataProcessing.title")}
              </h3>
              <p>{t("terms.dataProcessing.content")}</p>
            </section>

            <section style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
                {t("terms.localStorage.title")}
              </h3>
              <p>{t("terms.localStorage.content")}</p>
            </section>

            <section style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
                {t("terms.noCookies.title")}
              </h3>
              <p>{t("terms.noCookies.content")}</p>
            </section>

            <section style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
                {t("terms.privacy.title")}
              </h3>
              <p>{t("terms.privacy.content")}</p>
            </section>

            <section>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
                {t("terms.changes.title")}
              </h3>
              <p>{t("terms.changes.content")}</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
