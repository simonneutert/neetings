import { FunctionalComponent } from "preact";
import { useTranslation } from "../i18n/index";
import {
  getErrorSeverity,
  getLocalizedActionMessage,
  getLocalizedErrorMessage,
  isRecoverable,
} from "../utils/export/errors/ErrorMessages";

interface ImportProgress {
  stage: "starting" | "validating" | "processing" | "finalizing" | "complete";
  percentage: number;
  currentItem?: string;
}

interface ExportProgress {
  stage: "starting" | "preparing" | "generating" | "complete";
  percentage: number;
  currentFormat?: string;
}

interface ErrorDetail {
  code: string;
  message: string;
  action: string;
  severity: "error" | "warning" | "info";
  recoverable: boolean;
  technical?: string;
  context?: Record<string, any>;
}

interface PartialImportResult {
  successful: number;
  failed: number;
  warnings: number;
  total: number;
  importedMeetings?: any[];
  summary?: string;
}

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  error?: ErrorDetail | null;
  errors?: ErrorDetail[];
  partialResult?: PartialImportResult | null;
  importProgress?: ImportProgress | null;
  exportProgress?: ExportProgress | null;
  onRetry?: () => void;
  onPartialAccept?: () => void;
  showTechnicalDetails?: boolean;
}

export const ErrorModal: FunctionalComponent<ErrorModalProps> = (props) => {
  const {
    isOpen,
    onClose,
    title,
    error,
    errors = [],
    partialResult,
    importProgress,
    exportProgress,
    onRetry,
    onPartialAccept,
    showTechnicalDetails = false,
  } = props;

  const { t } = useTranslation();

  if (!isOpen) return null;

  const allErrors = error ? [error] : errors;
  const hasRecoverableErrors = allErrors.some((err) => err.recoverable);
  const hasPartialSuccess = partialResult && partialResult.successful > 0;

  const getProgressText = () => {
    if (importProgress) {
      const stageKey = `import.progress.${importProgress.stage}`;
      return t(stageKey);
    }
    if (exportProgress) {
      const stageKey = `export.progress.${exportProgress.stage}`;
      return t(stageKey);
    }
    return "";
  };

  const getProgressPercentage = () => {
    return importProgress?.percentage || exportProgress?.percentage || 0;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "❓";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "#dc3545";
      case "warning":
        return "#fd7e14";
      case "info":
        return "#0d6efd";
      default:
        return "#6c757d";
    }
  };

  const getSeverityBackgroundColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "#f8d7da";
      case "warning":
        return "#fff3cd";
      case "info":
        return "#d1ecf1";
      default:
        return "#f8f9fa";
    }
  };

  const getSeverityBorderColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "#f5c6cb";
      case "warning":
        return "#ffeaa7";
      case "info":
        return "#bee5eb";
      default:
        return "#dee2e6";
    }
  };

  const handleBackdropClick = (e: Event) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
      data-testid="error-modal-backdrop"
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "1.5rem",
          maxWidth: "700px",
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
            {title}
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

        {/* Progress Bar */}
        {(importProgress || exportProgress) && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#495057",
                }}
              >
                {getProgressText()}
              </span>
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "#6c757d",
                }}
              >
                {getProgressPercentage()}%
              </span>
            </div>
            <div
              style={{
                width: "100%",
                backgroundColor: "#e9ecef",
                borderRadius: "4px",
                height: "8px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  backgroundColor: "#007bff",
                  height: "100%",
                  borderRadius: "4px",
                  transition: "width 0.3s ease",
                  width: `${getProgressPercentage()}%`,
                }}
              />
            </div>
            {importProgress?.currentItem && (
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#6c757d",
                  marginTop: "0.25rem",
                  marginBottom: 0,
                }}
              >
                {importProgress.currentItem}
              </p>
            )}
            {exportProgress?.currentFormat && (
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#6c757d",
                  marginTop: "0.25rem",
                  marginBottom: 0,
                }}
              >
                {exportProgress.currentFormat}
              </p>
            )}
          </div>
        )}

        {/* Partial Success Summary */}
        {hasPartialSuccess && partialResult && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              backgroundColor: getSeverityBackgroundColor("warning"),
              border: `1px solid ${getSeverityBorderColor("warning")}`,
              borderRadius: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, marginRight: "0.75rem" }}>
                <span style={{ fontSize: "1.25rem" }}>⚠️</span>
              </div>
              <div style={{ flex: 1 }}>
                <h6
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: getSeverityColor("warning"),
                    margin: 0,
                    marginBottom: "0.25rem",
                  }}
                >
                  {t("success.import.partial_success")}
                </h6>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: getSeverityColor("warning"),
                    margin: 0,
                  }}
                >
                  {partialResult.summary}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error List */}
        {allErrors.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            {allErrors.map((err, index) => (
              <div
                key={index}
                style={{
                  padding: "1rem",
                  backgroundColor: getSeverityBackgroundColor(err.severity),
                  border: `1px solid ${getSeverityBorderColor(err.severity)}`,
                  borderRadius: "8px",
                  marginBottom: index < allErrors.length - 1 ? "1rem" : 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0, marginRight: "0.75rem" }}>
                    <span style={{ fontSize: "1.25rem" }}>
                      {getSeverityIcon(err.severity)}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h6
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        color: getSeverityColor(err.severity),
                        margin: 0,
                        marginBottom: "0.25rem",
                      }}
                    >
                      {err.message}
                    </h6>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: getSeverityColor(err.severity),
                        margin: 0,
                      }}
                    >
                      {err.action}
                    </p>
                    {showTechnicalDetails && err.technical && (
                      <details style={{ marginTop: "0.5rem" }}>
                        <summary
                          style={{
                            fontSize: "0.75rem",
                            color: "#6c757d",
                            cursor: "pointer",
                          }}
                        >
                          Technical Details
                        </summary>
                        <pre
                          style={{
                            marginTop: "0.25rem",
                            fontSize: "0.75rem",
                            color: "#495057",
                            backgroundColor: "#f8f9fa",
                            padding: "0.5rem",
                            borderRadius: "4px",
                            overflowX: "auto",
                            border: "1px solid #dee2e6",
                          }}
                        >
                          {err.technical}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Context Information */}
        {error?.context && Object.keys(error.context).length > 0 && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              border: "1px solid #dee2e6",
            }}
          >
            <h6
              style={{
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#495057",
                marginBottom: "0.5rem",
              }}
            >
              Additional Information
            </h6>
            <dl style={{ margin: 0 }}>
              {Object.entries(error.context).map(([key, value]) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    fontSize: "0.75rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  <dt
                    style={{
                      color: "#6c757d",
                      width: "33%",
                      textTransform: "capitalize",
                    }}
                  >
                    {key}:
                  </dt>
                  <dd
                    style={{
                      color: "#495057",
                      width: "67%",
                      margin: 0,
                    }}
                  >
                    {String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Modal Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
            paddingTop: "1rem",
            borderTop: "1px solid #dee2e6",
            marginTop: "1.5rem",
          }}
        >
          {hasPartialSuccess && onPartialAccept && (
            <button
              className="btn btn-warning"
              onClick={onPartialAccept}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#fd7e14",
                borderColor: "#fd7e14",
                color: "white",
                border: "1px solid transparent",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Accept Partial Import
            </button>
          )}

          {hasRecoverableErrors && onRetry && (
            <button
              className="btn btn-primary"
              onClick={onRetry}
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
              {t("common.retry")}
            </button>
          )}

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
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to create error details from error codes
export function createErrorDetail(
  code: string,
  technical: string,
  t: (key: string, options?: Record<string, string | number>) => string,
  context?: Record<string, any>,
): ErrorDetail {
  return {
    code,
    message: getLocalizedErrorMessage(code, t, context),
    action: getLocalizedActionMessage(code, t, context),
    severity: getErrorSeverity(code),
    recoverable: isRecoverable(code),
    technical,
    context,
  };
}
