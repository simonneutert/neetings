import { FunctionalComponent } from "preact";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { Meeting } from "../types/Meeting";
import { BaseExporter } from "../utils/export/BaseExporter";
import { ExportOptions } from "../utils/export/types/ExportTypes";
import { useTranslation } from "../i18n/index";
import { useGlobalAttendees } from "../hooks/useGlobalAttendees";
import { createErrorDetail, ErrorModal } from "./ErrorModal";

interface ExportProgress {
  stage: "starting" | "preparing" | "generating" | "complete";
  percentage: number;
  currentFormat?: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting;
  onFlushPendingUpdates?: () => Promise<void>;
}

export const ExportModal: FunctionalComponent<ExportModalProps> = ({
  isOpen,
  onClose,
  meeting,
  onFlushPendingUpdates,
}) => {
  const { t, language } = useTranslation();
  const { getAttendeesByIds } = useGlobalAttendees();
  const [format, setFormat] = useState<"markdown" | "rtf" | "docx" | "html">(
    "markdown",
  );
  const [filename, setFilename] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Progress modal state
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(
    null,
  );
  const [progressModalError, setProgressModalError] = useState<any>(null);

  const exporter = useMemo(() => new BaseExporter(), []);

  // Generate default filename when modal opens or meeting changes
  useEffect(() => {
    if (isOpen && meeting) {
      const defaultFilename = exporter.generateDefaultFilename(meeting, format);
      setFilename(defaultFilename);
    }
  }, [isOpen, meeting, format, exporter]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isExporting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, isExporting]);

  const handleExport = useCallback(async () => {
    if (!filename.trim()) {
      setExportError(t("importExport.modal.filenameRequired"));
      return;
    }

    setIsExporting(true);
    setExportError(null);
    setIsProgressModalOpen(true);
    setProgressModalError(null);

    try {
      // Progress callback
      const updateProgress = (
        stage: ExportProgress["stage"],
        percentage: number,
        currentFormat?: string,
      ) => {
        setExportProgress({ stage, percentage, currentFormat });
      };

      updateProgress("starting", 10);

      // Flush any pending updates to ensure we export the latest data
      if (onFlushPendingUpdates) {
        await onFlushPendingUpdates();
      }

      updateProgress("preparing", 30, format.toUpperCase());

      // Get attendee data for the meeting
      const attendees = getAttendeesByIds(meeting.attendeeIds);

      const options: ExportOptions = {
        format,
        filename: filename.trim(),
        t, // Pass translation function for localized content
        language, // Pass current language explicitly
        attendees, // Pass attendee data for resolving attendeeIds
      };

      updateProgress("generating", 60, format.toUpperCase());

      const result = await exporter.export(meeting, options);

      updateProgress("generating", 90, format.toUpperCase());

      await exporter.downloadFile(result);

      updateProgress("complete", 100);

      // Show success briefly then close
      setTimeout(() => {
        setIsProgressModalOpen(false);
        setExportProgress(null);
        onClose();
      }, 1500);
    } catch (error) {
      // Show error in progress modal
      const errorDetail = createErrorDetail(
        "EXPORT_FORMAT_ERROR",
        error instanceof Error ? error.message : "Export operation failed",
        t,
        { format, filename: filename.trim() },
      );
      setProgressModalError(errorDetail);
      setExportProgress(null);

      // Also set local error for the main modal
      setExportError(
        error instanceof Error
          ? error.message
          : t("importExport.modal.exportFailed"),
      );
    } finally {
      setIsExporting(false);
    }
  }, [
    meeting,
    format,
    filename,
    exporter,
    onClose,
    onFlushPendingUpdates,
    t,
    language,
    getAttendeesByIds,
  ]);

  const closeProgressModal = () => {
    setIsProgressModalOpen(false);
    setExportProgress(null);
    setProgressModalError(null);
  };

  const retryExport = () => {
    closeProgressModal();
    setTimeout(() => handleExport(), 100);
  };

  const handleBackdropClick = (e: Event) => {
    if (e.target === e.currentTarget && !isExporting) {
      onClose();
    }
  };

  const handleFilenameChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setFilename(target.value);
    setExportError(null);
  };

  if (!isOpen) return null;

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
      data-testid="export-modal-backdrop"
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
          <h5 style={{ margin: 0 }}>
            {t("importExport.modal.title")}
            <small
              style={{
                display: "block",
                color: "#6c757d",
                fontSize: "0.8rem",
                fontWeight: "normal",
              }}
            >
              {meeting.title}
            </small>
          </h5>
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: isExporting ? "not-allowed" : "pointer",
              padding: "0.25rem",
              opacity: isExporting ? 0.5 : 1,
            }}
            title={t("common.close")}
          >
            ×
          </button>
        </div>

        {/* Export Form */}
        <div style={{ marginBottom: "1.5rem" }}>
          {/* Format Selection */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
                fontSize: "0.9rem",
              }}
            >
              {t("importExport.modal.format")}
            </label>
            <select
              value={format}
              onChange={(e) =>
                setFormat(
                  (e.target as HTMLSelectElement).value as
                    | "markdown"
                    | "rtf"
                    | "docx"
                    | "html",
                )}
              disabled={isExporting}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "0.9rem",
                backgroundColor: isExporting ? "#f8f9fa" : "white",
              }}
            >
              <option value="markdown">
                {t("importExport.modal.formatMarkdown")}
              </option>
              <option value="rtf">{t("importExport.modal.formatRTF")}</option>
              <option value="docx">{t("importExport.modal.formatDOCX")}</option>
              <option value="html">{t("importExport.modal.formatHTML")}</option>
            </select>
            <small style={{ color: "#6c757d", fontSize: "0.75rem" }}>
              {t("importExport.modal.formatDescription")}
            </small>
          </div>

          {/* Filename Input */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
                fontSize: "0.9rem",
              }}
            >
              {t("importExport.modal.filename")}
            </label>
            <input
              type="text"
              value={filename}
              onChange={handleFilenameChange}
              disabled={isExporting}
              placeholder={t("importExport.modal.filenamePlaceholder")}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: exportError ? "1px solid #dc3545" : "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "0.9rem",
                backgroundColor: isExporting ? "#f8f9fa" : "white",
              }}
            />
            {exportError && (
              <small style={{ color: "#dc3545", fontSize: "0.75rem" }}>
                {exportError}
              </small>
            )}
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
            disabled={isExporting}
            style={{
              padding: "0.5rem 1rem",
              cursor: isExporting ? "not-allowed" : "pointer",
              opacity: isExporting ? 0.5 : 1,
            }}
          >
            {t("common.cancel")}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={isExporting || !filename.trim()}
            style={{
              padding: "0.5rem 1rem",
              cursor: (isExporting || !filename.trim())
                ? "not-allowed"
                : "pointer",
              opacity: (isExporting || !filename.trim()) ? 0.5 : 1,
            }}
          >
            {isExporting
              ? t("importExport.modal.exporting")
              : t("importExport.modal.exportButton")}
          </button>
        </div>
      </div>

      {/* Progress Modal */}
      <ErrorModal
        isOpen={isProgressModalOpen}
        onClose={closeProgressModal}
        title={t("importExport.modal.title")}
        error={progressModalError}
        exportProgress={exportProgress}
        onRetry={progressModalError ? retryExport : undefined}
        showTechnicalDetails={false}
      />
    </div>
  );
};
