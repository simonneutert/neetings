import { FunctionalComponent } from "preact";
import { useTranslation } from "../i18n/index";
import { ImportExportButtons } from "./ImportExportButtons";

interface HeroProps {
  onCreateMeeting?: () => void;
  meetings?: any[];
  onImportMeetings?: (meetings: any[]) => void;
  onFlushPendingUpdates?: () => Promise<void>;
  onTermsClick?: () => void;
  seriesTitle?: string;
  seriesAgenda?: string;
  onUpdateSeries?: (updates: { title?: string; agenda?: string }) => void;
}

export const Hero: FunctionalComponent<HeroProps> = ({
  onCreateMeeting,
  meetings = [],
  onImportMeetings,
  onFlushPendingUpdates,
  onTermsClick,
  seriesTitle = "New Meeting Series",
  seriesAgenda = "",
  onUpdateSeries,
}) => {
  const { t } = useTranslation();

  return (
    <div style={{ margin: "2rem auto", maxWidth: "800px" }}>
      {/* Hero Section */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, #0d47a1 0%, #1976d2 100%)",
          color: "white",
          border: "none",
          marginBottom: "3rem",
          boxShadow: "0 8px 32px rgba(13, 71, 161, 0.3)",
        }}
      >
        <div className="card-body" style={{ padding: "2rem" }}>
          <h2
            style={{
              fontSize: "1.8rem",
              marginBottom: "1rem",
              fontWeight: "600",
            }}
          >
            {t("faq.hero.title")}
          </h2>
          <p
            style={{
              fontSize: "1.1rem",
              marginBottom: "1.5rem",
              opacity: "0.95",
            }}
          >
            {t("faq.hero.description")}
          </p>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <span
              className="badge bg-light text-primary"
              style={{
                fontSize: "0.9rem",
                padding: "0.5rem 1rem",
              }}
            >
              {t("faq.hero.badges.private")}
            </span>
            <span
              className="badge bg-light text-primary"
              style={{
                fontSize: "0.9rem",
                padding: "0.5rem 1rem",
              }}
            >
              {t("faq.hero.badges.setup")}
            </span>
            <span
              className="badge bg-light text-primary"
              style={{
                fontSize: "0.9rem",
                padding: "0.5rem 1rem",
              }}
            >
              {t("faq.hero.badges.blocks")}
            </span>
            <span
              className="badge bg-light text-primary"
              style={{
                fontSize: "0.9rem",
                padding: "0.5rem 1rem",
              }}
            >
              {t("faq.hero.badges.kanban")}
            </span>
          </div>

          {/* Start Taking Notes button and Import/Export buttons */}
          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <button
              className="btn btn-light btn-lg"
              onClick={onCreateMeeting}
              style={{
                color: "#1976d2",
                fontWeight: "600",
                padding: "0.75rem 2rem",
                fontSize: "1.1rem",
                boxShadow: "0 4px 16px rgba(255,255,255,0.3)",
                border: "2px solid rgba(255,255,255,0.8)",
                marginBottom: "1rem",
              }}
            >
              {t("faq.hero.startButton")}
            </button>

            {/* Import/Export buttons */}
            {onImportMeetings && (
              <ImportExportButtons
                meetings={meetings}
                onImportMeetings={onImportMeetings}
                onFlushPendingUpdates={onFlushPendingUpdates}
                variant="light"
                seriesTitle={seriesTitle}
                seriesAgenda={seriesAgenda}
                onUpdateSeries={onUpdateSeries}
              />
            )}

            {/* Terms agreement hint */}
            <div
              style={{
                marginTop: "1.5rem",
                fontSize: "0.85rem",
                opacity: "0.8",
                lineHeight: "1.4",
              }}
            >
              {t("faq.hero.termsAgreement")}{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (onTermsClick) onTermsClick();
                }}
                style={{
                  color: "rgba(255,255,255,0.9)",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                {t("faq.hero.termsLink")}
              </a>
              .
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
