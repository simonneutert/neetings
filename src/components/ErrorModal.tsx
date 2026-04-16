import { FunctionalComponent } from "preact";
import { useState } from "preact/hooks";
import { useTranslation } from "../i18n/index";
import {
  getErrorSeverity,
  getLocalizedActionMessage,
  getLocalizedErrorMessage,
  isRecoverable,
} from "../utils/export/errors/ErrorMessages";

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
  failedItemDetails?: {
    meetings: Array<{ title?: string; date?: string; reason?: string }>;
    attendees: Array<{ name?: string; reason?: string }>;
  };
}

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  error?: ErrorDetail | null;
  errors?: ErrorDetail[];
  partialResult?: PartialImportResult | null;
  isLoading?: boolean;
  onRetry?: () => void;
  onPartialAccept?: () => void;
  // Legacy props — accepted but mapped to isLoading internally
  importProgress?: any;
  exportProgress?: any;
}

export const ErrorModal: FunctionalComponent<ErrorModalProps> = (props) => {
  const {
    isOpen,
    onClose,
    title,
    error,
    errors = [],
    partialResult,
    isLoading: isLoadingProp,
    importProgress,
    exportProgress,
    onRetry,
    onPartialAccept,
  } = props;

  const { t } = useTranslation();
  const [showFailedDetails, setShowFailedDetails] = useState(false);

  if (!isOpen) return null;

  // Support legacy progress props as isLoading
  const isLoading = isLoadingProp || !!importProgress || !!exportProgress;

  const allErrors = error ? [error] : errors;
  const hasRecoverableErrors = allErrors.some((err) => err.recoverable);
  const hasPartialSuccess = partialResult && partialResult.successful > 0;

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
          backgroundColor: "var(--bs-body-bg)",
          borderRadius: "12px",
          padding: "1.5rem",
          maxWidth: "700px",
          width: "95%",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          animation: "slideUp 0.3s ease-out",
          border: "1px solid var(--bs-border-color)",
          color: "var(--bs-body-color)",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            borderBottom: "1px solid var(--bs-border-color)",
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
              color: "var(--bs-secondary-color)",
            }}
            title={t("common.close")}
          >
            ×
          </button>
        </div>

        {/* Loading Spinner */}
        {isLoading && allErrors.length === 0 && !hasPartialSuccess && (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <div
              className="spinner-border text-primary"
              role="status"
              style={{ width: "3rem", height: "3rem" }}
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <p
              style={{ marginTop: "1rem", color: "var(--bs-secondary-color)" }}
            >
              {t("common.loading")}
            </p>
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

        {/* Failed Items Details (collapsible) */}
        {hasPartialSuccess && partialResult?.failedItemDetails &&
          (partialResult.failedItemDetails.meetings.length > 0 ||
            partialResult.failedItemDetails.attendees.length > 0) &&
          (
            <div style={{ marginBottom: "1.5rem" }}>
              <button
                onClick={() => setShowFailedDetails(!showFailedDetails)}
                style={{
                  background: "none",
                  border: "1px solid var(--bs-border-color)",
                  borderRadius: "6px",
                  padding: "0.5rem 0.75rem",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  color: "var(--bs-secondary-color)",
                  width: "100%",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                data-testid="toggle-failed-details"
              >
                <span
                  style={{
                    display: "inline-block",
                    transition: "transform 0.2s",
                    transform: showFailedDetails
                      ? "rotate(90deg)"
                      : "rotate(0deg)",
                  }}
                >
                  ▶
                </span>
                {t("importExport.partialImport.showDetails")}
              </button>

              {showFailedDetails && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.75rem",
                    backgroundColor: "var(--bs-tertiary-bg)",
                    border: "1px solid var(--bs-border-color)",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                  }}
                  data-testid="failed-details-section"
                >
                  {partialResult.failedItemDetails.meetings.length > 0 && (
                    <div
                      style={{
                        marginBottom:
                          partialResult.failedItemDetails.attendees.length > 0
                            ? "0.75rem"
                            : 0,
                      }}
                    >
                      <h6
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          margin: "0 0 0.5rem 0",
                          color: "var(--bs-body-color)",
                        }}
                      >
                        {t("importExport.partialImport.failedMeetings", {
                          count:
                            partialResult.failedItemDetails.meetings.length,
                        })}
                      </h6>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "1.25rem",
                          listStyle: "disc",
                        }}
                      >
                        {partialResult.failedItemDetails.meetings.map((
                          m,
                          i,
                        ) => (
                          <li
                            key={i}
                            style={{
                              marginBottom: "0.25rem",
                              color: "var(--bs-secondary-color)",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: "500",
                                color: "var(--bs-body-color)",
                              }}
                            >
                              {m.title}
                              {m.date ? ` (${m.date})` : ""}
                            </span>
                            {m.reason && <span>— {m.reason}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {partialResult.failedItemDetails.attendees.length > 0 && (
                    <div>
                      <h6
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          margin: "0 0 0.5rem 0",
                          color: "var(--bs-body-color)",
                        }}
                      >
                        {t("importExport.partialImport.failedAttendees", {
                          count:
                            partialResult.failedItemDetails.attendees.length,
                        })}
                      </h6>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "1.25rem",
                          listStyle: "disc",
                        }}
                      >
                        {partialResult.failedItemDetails.attendees.map((
                          a,
                          i,
                        ) => (
                          <li
                            key={i}
                            style={{
                              marginBottom: "0.25rem",
                              color: "var(--bs-secondary-color)",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: "500",
                                color: "var(--bs-body-color)",
                              }}
                            >
                              {a.name}
                            </span>
                            {a.reason && <span>— {a.reason}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Footer */}
        {(!isLoading || allErrors.length > 0 || hasPartialSuccess) && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
              paddingTop: "1rem",
              borderTop: "1px solid var(--bs-border-color)",
              marginTop: "1.5rem",
            }}
          >
            {hasPartialSuccess && onPartialAccept && (
              <button
                className="btn btn-warning"
                onClick={onPartialAccept}
                style={{
                  padding: "0.5rem 1rem",
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
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              {t("common.close")}
            </button>
          </div>
        )}
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
