import { FunctionalComponent } from "preact";
import { useTranslation } from "../i18n/index";
import { ErrorModal } from "./ErrorModal";
import type { ExportProgress } from "../hooks/useImportExport";

interface JsonExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  exportProgress: ExportProgress | null;
  modalError: any;
  seriesTitle?: string;
}

export const JsonExportModal: FunctionalComponent<JsonExportModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  exportProgress,
  modalError,
  seriesTitle = "Meeting Series",
}) => {
  const { t } = useTranslation();

  const handleBackdropClick = (e: Event) => {
    if (e.target === e.currentTarget && !exportProgress) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // If there's progress or error, show the ErrorModal
  if (exportProgress || modalError) {
    return (
      <ErrorModal
        isOpen={true}
        onClose={onClose}
        title={t("importExport.export")}
        error={modalError}
        exportProgress={exportProgress}
        showTechnicalDetails={false}
      />
    );
  }

  // Otherwise show the confirmation modal
  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={handleBackdropClick}
      data-testid="json-export-modal-backdrop"
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "1.5rem",
          maxWidth: "500px",
          width: "95%",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          animation: "slideUp 0.3s ease-out",
          border: "1px solid #e9ecef",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            borderBottom: "1px solid #dee2e6",
            paddingBottom: "1rem",
          }}
        >
          <h5 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "500" }}>
            {t("importExport.export")}
            <small
              style={{
                display: "block",
                color: "#6c757d",
                fontSize: "0.8rem",
                fontWeight: "normal",
              }}
            >
              {seriesTitle}
            </small>
          </h5>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: "0.25rem",
              color: "#6c757d",
            }}
            title={t("common.close")}
          >
            ×
          </button>
        </div>

        {/* Export Info */}
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ marginBottom: "1rem", color: "#495057" }}>
            {t("importExport.exportConfirm.message", { format: "JSON" })}
          </p>
          <div
            style={{
              backgroundColor: "#f8f9fa",
              padding: "1rem",
              borderRadius: "8px",
              border: "1px solid #dee2e6",
            }}
          >
            <h6 style={{ marginBottom: "0.5rem", color: "#495057" }}>
              {t("importExport.exportConfirm.includes")}:
            </h6>
            <ul style={{ marginBottom: 0, paddingLeft: "1.2rem" }}>
              <li>{t("importExport.exportConfirm.meetings")}</li>
              <li>{t("importExport.exportConfirm.attendees")}</li>
              <li>{t("importExport.exportConfirm.seriesInfo")}</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
            paddingTop: "1rem",
            borderTop: "1px solid #dee2e6",
          }}
        >
          <button
            className="btn btn-outline-secondary"
            onClick={onClose}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "transparent",
              borderColor: "#6c757d",
              color: "#6c757d",
              border: "1px solid #6c757d",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            {t("common.cancel")}
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#007bff",
              borderColor: "#007bff",
              color: "white",
              border: "1px solid transparent",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            📤 {t("importExport.exportButton")}
          </button>
        </div>
      </div>
    </div>
  );
};
