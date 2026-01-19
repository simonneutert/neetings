import { useState } from "preact/hooks";
import { useTranslation } from "../i18n/index";
import { useGlobalAttendees } from "./useGlobalAttendees";
import { BaseExporter } from "../utils/export/BaseExporter";
import { createErrorDetail } from "../components/ErrorModal";
import { formatImportSummary } from "../utils/export/errors/ErrorMessages";
import { APP_CONFIG } from "../constants/index";
import { createExportFilename, createExportV1 } from "../schemas/index";

export interface ImportProgress {
  stage: "starting" | "validating" | "processing" | "finalizing" | "complete";
  percentage: number;
  currentItem?: string;
}

export interface ExportProgress {
  stage: "starting" | "preparing" | "generating" | "complete";
  percentage: number;
  currentFormat?: string;
}

export interface PartialImportResult {
  successful: number;
  failed: number;
  warnings: number;
  total: number;
  importedMeetings?: any[];
  summary?: string;
}

export interface ImportExportModalState {
  isImportModalOpen: boolean;
  isExportModalOpen: boolean;
  modalTitle: string;
  modalError: any;
  modalErrors: any[];
  partialResult: PartialImportResult | null;
  importProgress: ImportProgress | null;
  exportProgress: ExportProgress | null;
  pendingImportData: any;
}

export function useImportExport(
  meetings: any[],
  onImportMeetings: (meetings: any[]) => void,
  onFlushPendingUpdates?: () => Promise<void>,
  seriesTitle?: string,
  seriesAgenda?: string,
  onUpdateSeries?: (updates: { title?: string; agenda?: string }) => void,
) {
  const { t } = useTranslation();
  const { attendees, refreshAttendees } = useGlobalAttendees();

  // Helper function to update attendees in localStorage
  const setAttendeesInStorage = (attendees: any[]) => {
    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
      JSON.stringify(attendees),
    );
    refreshAttendees();
  };

  // Modal state
  const [state, setState] = useState<ImportExportModalState>({
    isImportModalOpen: false,
    isExportModalOpen: false,
    modalTitle: "",
    modalError: null,
    modalErrors: [],
    partialResult: null,
    importProgress: null,
    exportProgress: null,
    pendingImportData: null,
  });

  const baseExporter = new BaseExporter();

  // Helper to update state
  const updateState = (updates: Partial<ImportExportModalState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  // Import operations
  const startImport = () => {
    // Check if meetings exist and show confirmation dialog
    if (meetings.length > 0) {
      const confirmed = confirm(t("importExport.importConfirm.message"));
      if (!confirmed) {
        return; // User cancelled
      }
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      performImport(file);
    };
    input.click();
  };

  const performImport = async (file: File) => {
    // Reset modal state
    updateState({
      importProgress: { stage: "starting", percentage: 0 },
      modalTitle: t("importExport.import"),
      isImportModalOpen: true,
      modalError: null,
      modalErrors: [],
      partialResult: null,
      pendingImportData: null,
    });

    try {
      // Progress callback for detailed feedback
      const progressCallback = (percentage: number, status: string) => {
        // Map status to stage
        let stage: ImportProgress["stage"] = "processing";
        if (status.includes("Validating")) stage = "validating";
        else if (status.includes("Reading")) stage = "starting";
        else if (
          status.includes("Processing") || status.includes("Finalizing")
        ) stage = "finalizing";
        else if (status.includes("completed")) stage = "complete";

        updateState({
          importProgress: { stage, percentage, currentItem: status },
        });
      };

      // Use enhanced BaseExporter with recovery
      const startTime = Date.now();
      const result = await baseExporter.importWithRecovery(
        file,
        undefined,
        progressCallback,
        t,
      );

      // Ensure minimum 1-second delay for better UX
      const elapsedTime = Date.now() - startTime;
      const minimumDelay = 1000; // 1 second
      if (elapsedTime < minimumDelay) {
        await new Promise((resolve) =>
          setTimeout(resolve, minimumDelay - elapsedTime)
        );
      }

      if (result.success) {
        // Handle successful import
        await handleSuccessfulImport(result);
      } else if (result.partialSuccess && result.recoveredData) {
        // Handle partial success
        handlePartialImport(result);
      } else {
        // Handle complete failure
        handleFailedImport(result);
      }
    } catch (err) {
      console.error("Import failed:", err);

      // Create error detail for unexpected errors
      const errorDetail = createErrorDetail(
        "UNKNOWN_ERROR",
        err instanceof Error ? err.message : "Unknown error occurred",
        t,
      );
      updateState({
        modalError: errorDetail,
        importProgress: null,
      });
    }
  };

  const handleSuccessfulImport = async (result: any) => {
    const importedData = result.imported;
    const importedMeetings = importedData?.meetings || [];
    const importedAttendees = importedData?.attendees || [];
    const importedSeriesTitle = importedData?.title;
    const importedSeriesAgenda = importedData?.agenda;

    // Always import attendees (even if empty array to clear existing ones)
    setAttendeesInStorage(importedAttendees);

    // Apply meetings to app state
    onImportMeetings(importedMeetings);

    // Restore series data if available
    if (onUpdateSeries && (importedSeriesTitle || importedSeriesAgenda)) {
      const seriesUpdates: { title?: string; agenda?: string } = {};
      if (importedSeriesTitle) seriesUpdates.title = importedSeriesTitle;
      if (importedSeriesAgenda) seriesUpdates.agenda = importedSeriesAgenda;
      onUpdateSeries(seriesUpdates);
    }

    // Show success
    updateState({
      importProgress: { stage: "complete", percentage: 100 },
    });
    setTimeout(() => {
      updateState({
        isImportModalOpen: false,
        importProgress: null,
      });
    }, 1500);
  };

  const handlePartialImport = (result: any) => {
    updateState({
      partialResult: {
        successful: result.recoveredData.recoveredCount || 0,
        failed: result.failedItems || 0,
        warnings: result.warnings?.length || 0,
        total: result.totalItems || 0,
        importedMeetings: result.recoveredData.validMeetings || [],
        summary: result.summary || formatImportSummary(
          result.totalItems || 0,
          result.recoveredData.recoveredCount || 0,
          result.failedItems || 0,
          result.warnings?.length || 0,
          t,
        ),
      },
      pendingImportData: {
        meetings: result.recoveredData.validMeetings || [],
        attendees: result.recoveredData.validAttendees || [],
      },
      modalErrors: (result.errors || []).map((error: any) =>
        createErrorDetail(
          error.code || "VALIDATION_WARNING",
          error.message,
          t,
          { field: error.field },
        )
      ),
      importProgress: null,
    });
  };

  const handleFailedImport = (result: any) => {
    updateState({
      modalErrors: (result.errors || []).map((error: any) =>
        createErrorDetail(error.code || "UNKNOWN_ERROR", error.message, t, {
          field: error.field,
        })
      ),
      importProgress: null,
    });
  };

  const acceptPartialImport = () => {
    if (state.pendingImportData) {
      const { meetings, attendees } = state.pendingImportData;

      // Always import attendees (even if empty array to clear existing ones)
      if (attendees) {
        setAttendeesInStorage(attendees);
      }

      // Apply meetings to app state
      onImportMeetings(meetings || []);

      // Close modal and reset state
      closeImportModal();
    }
  };

  const retryImport = () => {
    closeImportModal();
    // Trigger import again
    setTimeout(() => startImport(), 100);
  };

  const closeImportModal = () => {
    updateState({
      isImportModalOpen: false,
      importProgress: null,
      modalError: null,
      modalErrors: [],
      partialResult: null,
      pendingImportData: null,
    });
  };

  // Export operations
  const startExport = () => {
    if (meetings.length === 0) {
      alert(t("importExport.noMeetingsToExport"));
      return;
    }

    updateState({
      isExportModalOpen: true,
    });
  };

  const performExport = async () => {
    // Reset modal state
    updateState({
      exportProgress: { stage: "starting", percentage: 0 },
      modalTitle: t("importExport.export"),
      modalError: null,
    });

    try {
      // Progress callback for detailed feedback
      const progressCallback = (
        stage: ExportProgress["stage"],
        percentage: number,
        currentFormat?: string,
      ) => {
        updateState({
          exportProgress: { stage, percentage, currentFormat },
        });
      };

      progressCallback("starting", 10);

      // Flush any pending updates to ensure we export the latest data
      if (onFlushPendingUpdates) {
        await onFlushPendingUpdates();
      }

      progressCallback("preparing", 30, "JSON");

      // Create export data using schema helper with series information
      const exportData = createExportV1(
        meetings,
        attendees,
        seriesTitle || "Meeting Series",
        seriesAgenda || "",
      );

      progressCallback("generating", 70, "JSON");

      // Note: localStorage persistence for meetings is now handled by the update queue
      // We only need to ensure attendees are saved here since they use immediate saves
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
        JSON.stringify(attendees),
      );

      // Create and download comprehensive backup file with sanitized filename
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = createExportFilename(seriesTitle || "Meeting Series");
      document.body.appendChild(a);
      a.click();

      progressCallback("complete", 100);

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);

      // Show success modal briefly
      setTimeout(() => {
        closeExportModal();
      }, 1500);
    } catch (e) {
      console.error("Export failed:", e);

      const errorDetail = createErrorDetail(
        "EXPORT_FORMAT_ERROR",
        e instanceof Error ? e.message : "Export operation failed",
        t,
      );
      updateState({
        modalError: errorDetail,
        exportProgress: null,
      });
    }
  };

  const closeExportModal = () => {
    updateState({
      isExportModalOpen: false,
      exportProgress: null,
      modalError: null,
    });
  };

  return {
    // State
    state,

    // Import operations
    startImport,
    acceptPartialImport,
    retryImport,
    closeImportModal,

    // Export operations
    startExport,
    performExport,
    closeExportModal,
  };
}
