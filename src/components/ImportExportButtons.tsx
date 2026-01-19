import { FunctionalComponent } from "preact";
import { useTranslation } from "../i18n/index";
import { useImportExport } from "../hooks/useImportExport";
import { ImportModal } from "./ImportModal";
import { JsonExportModal } from "./JsonExportModal";

interface ImportExportButtonsProps {
  meetings: any[];
  onImportMeetings: (meetings: any[]) => void;
  onFlushPendingUpdates?: () => Promise<void>;
  variant?: "default" | "light";
  style?: any;
  seriesTitle?: string;
  seriesAgenda?: string;
  onUpdateSeries?: (updates: { title?: string; agenda?: string }) => void;
}

export const ImportExportButtons: FunctionalComponent<
  ImportExportButtonsProps
> = ({
  meetings,
  onImportMeetings,
  onFlushPendingUpdates,
  variant = "default",
  style = {},
  seriesTitle = "Meeting Series",
  seriesAgenda = "",
  onUpdateSeries,
}) => {
  const { t } = useTranslation();

  const {
    state,
    startImport,
    acceptPartialImport,
    retryImport,
    closeImportModal,
    startExport,
    performExport,
    closeExportModal,
  } = useImportExport(
    meetings,
    onImportMeetings,
    onFlushPendingUpdates,
    seriesTitle,
    seriesAgenda,
    onUpdateSeries,
  );

  const buttonClass = variant === "light"
    ? "btn btn-outline-light"
    : "btn btn-outline-primary";

  const buttonStyle = variant === "light"
    ? {
      borderColor: "rgba(255,255,255,0.8)",
      color: "white",
      transition: "all 0.2s ease",
      ...style,
    }
    : style;

  const handleMouseEnter = (e: MouseEvent) => {
    if (variant === "light") {
      const button = e.target as HTMLElement;
      button.style.backgroundColor = "rgba(255,255,255,0.2)";
      button.style.borderColor = "white";
      button.style.color = "white";
    }
  };

  const handleMouseLeave = (e: MouseEvent) => {
    if (variant === "light") {
      const button = e.target as HTMLElement;
      button.style.backgroundColor = "transparent";
      button.style.borderColor = "rgba(255,255,255,0.8)";
      button.style.color = "white";
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          className={buttonClass}
          onClick={startImport}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={buttonStyle}
        >
          📥 {t("importExport.import")}
        </button>
        <button
          className={buttonClass}
          onClick={startExport}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={buttonStyle}
        >
          📤 {t("importExport.export")}
        </button>
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={state.isImportModalOpen}
        onClose={closeImportModal}
        importProgress={state.importProgress}
        modalError={state.modalError}
        modalErrors={state.modalErrors}
        partialResult={state.partialResult}
        onRetry={retryImport}
        onPartialAccept={acceptPartialImport}
      />

      {/* Export Modal */}
      <JsonExportModal
        isOpen={state.isExportModalOpen}
        onClose={closeExportModal}
        onConfirm={performExport}
        exportProgress={state.exportProgress}
        modalError={state.modalError}
        seriesTitle={seriesTitle}
      />
    </>
  );
};
