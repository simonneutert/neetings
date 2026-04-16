import { useState } from "preact/hooks";
import { useTranslation } from "../i18n/index";
import { useGlobalAttendees } from "./useGlobalAttendees";
import { BaseExporter } from "../utils/export/BaseExporter";
import { createErrorDetail } from "../components/ErrorModal";
import { formatImportSummary } from "../utils/export/errors/ErrorMessages";
import { APP_CONFIG } from "../constants/index";
import { createExportFilename, createExportV1 } from "../schemas/index";

export interface PartialImportResult {
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

export interface ImportExportModalState {
  isImportModalOpen: boolean;
  isExportModalOpen: boolean;
  modalError: any;
  modalErrors: any[];
  partialResult: PartialImportResult | null;
  isLoading: boolean;
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

  const setAttendeesInStorage = (attendees: any[]) => {
    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
      JSON.stringify(attendees),
    );
    refreshAttendees();
  };

  const [state, setState] = useState<ImportExportModalState>({
    isImportModalOpen: false,
    isExportModalOpen: false,
    modalError: null,
    modalErrors: [],
    partialResult: null,
    isLoading: false,
    pendingImportData: null,
  });

  const baseExporter = new BaseExporter();

  const updateState = (updates: Partial<ImportExportModalState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  // Import operations
  const startImport = () => {
    if (meetings.length > 0) {
      const confirmed = confirm(t("importExport.importConfirm.message"));
      if (!confirmed) {
        return;
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
    updateState({
      isLoading: true,
      isImportModalOpen: true,
      modalError: null,
      modalErrors: [],
      partialResult: null,
      pendingImportData: null,
    });

    try {
      const result = await baseExporter.importWithRecovery(file, t);

      if (result.success) {
        await handleSuccessfulImport(result);
      } else if (result.partialSuccess && result.recoveredData) {
        handlePartialImport(result);
      } else {
        handleFailedImport(result);
      }
    } catch (err) {
      console.error("Import failed:", err);

      const errorDetail = createErrorDetail(
        "UNKNOWN_ERROR",
        err instanceof Error ? err.message : "Unknown error occurred",
        t,
      );
      updateState({
        modalError: errorDetail,
        isLoading: false,
      });
    }
  };

  const handleSuccessfulImport = async (result: any) => {
    const importedData = result.imported;
    const importedMeetings = importedData?.meetings || [];
    const importedAttendees = importedData?.attendees || [];
    const importedSeriesTitle = importedData?.title;
    const importedSeriesAgenda = importedData?.agenda;

    setAttendeesInStorage(importedAttendees);
    onImportMeetings(importedMeetings);

    if (onUpdateSeries && (importedSeriesTitle || importedSeriesAgenda)) {
      const seriesUpdates: { title?: string; agenda?: string } = {};
      if (importedSeriesTitle) seriesUpdates.title = importedSeriesTitle;
      if (importedSeriesAgenda) seriesUpdates.agenda = importedSeriesAgenda;
      onUpdateSeries(seriesUpdates);
    }

    updateState({
      isLoading: false,
    });
    setTimeout(() => {
      updateState({
        isImportModalOpen: false,
      });
    }, 1500);
  };

  const handlePartialImport = (result: any) => {
    const invalidMeetings = result.recoveredData?.invalidMeetings || [];
    const invalidAttendees = result.recoveredData?.invalidAttendees || [];

    updateState({
      partialResult: {
        successful: result.recoveredData.recoveredCount || 0,
        failed: result.failedItems || 0,
        warnings: result.warnings?.length || 0,
        total: result.totalItems || 0,
        importedMeetings: result.recoveredData.validMeetings || [],
        failedItemDetails: {
          meetings: invalidMeetings.map((m: any) => ({
            title: m?.title || t("importExport.partialImport.unknownMeeting"),
            date: m?.date,
            reason: !m?.id
              ? t("importExport.partialImport.missingId")
              : !m?.title
              ? t("importExport.partialImport.missingTitle")
              : !m?.date
              ? t("importExport.partialImport.missingDate")
              : !Array.isArray(m?.blocks)
              ? t("importExport.partialImport.missingBlocks")
              : t("importExport.partialImport.invalidData"),
          })),
          attendees: invalidAttendees.map((a: any) => ({
            name: a?.name || t("importExport.partialImport.unknownAttendee"),
            reason: !a?.id
              ? t("importExport.partialImport.missingId")
              : !a?.name || !a.name.trim()
              ? t("importExport.partialImport.missingName")
              : t("importExport.partialImport.invalidData"),
          })),
        },
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
      isLoading: false,
    });
  };

  const handleFailedImport = (result: any) => {
    updateState({
      modalErrors: (result.errors || []).map((error: any) =>
        createErrorDetail(error.code || "UNKNOWN_ERROR", error.message, t, {
          field: error.field,
        })
      ),
      isLoading: false,
    });
  };

  const acceptPartialImport = () => {
    if (state.pendingImportData) {
      const { meetings, attendees } = state.pendingImportData;

      if (attendees) {
        setAttendeesInStorage(attendees);
      }

      onImportMeetings(meetings || []);
      closeImportModal();
    }
  };

  const retryImport = () => {
    closeImportModal();
    setTimeout(() => startImport(), 100);
  };

  const closeImportModal = () => {
    updateState({
      isImportModalOpen: false,
      isLoading: false,
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
    updateState({
      isLoading: true,
      modalError: null,
    });

    try {
      if (onFlushPendingUpdates) {
        await onFlushPendingUpdates();
      }

      // Read latest attendees from localStorage
      let currentAttendees = attendees;
      try {
        const stored = localStorage.getItem(
          APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
        );
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            currentAttendees = parsed;
          }
        }
      } catch (err) {
        console.warn(
          "useImportExport: failed to read attendees from localStorage during export",
          err,
        );
      }

      const exportData = createExportV1(
        meetings,
        currentAttendees,
        seriesTitle || "Meeting Series",
        seriesAgenda || "",
      );

      // Ensure storage reflects what we exported
      try {
        localStorage.setItem(
          APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
          JSON.stringify(currentAttendees),
        );
      } catch (err) {
        console.warn(
          "useImportExport: failed to persist attendees to localStorage during export",
          err,
        );
      }

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

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);

      updateState({ isLoading: false });

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
        isLoading: false,
      });
    }
  };

  const closeExportModal = () => {
    updateState({
      isExportModalOpen: false,
      isLoading: false,
      modalError: null,
    });
  };

  return {
    state,
    startImport,
    acceptPartialImport,
    retryImport,
    closeImportModal,
    startExport,
    performExport,
    closeExportModal,
  };
}
