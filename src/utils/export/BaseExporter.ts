import { Meeting } from "../../types/Meeting";
import {
  ExportOptions,
  ExportResult,
  FormatTransformer,
} from "./types/ExportTypes";
import { MarkdownTransformer } from "./transformers/MarkdownTransformer";
import { RTFTransformer } from "./transformers/RTFTransformer";
import { DOCXTransformer } from "./transformers/DOCXTransformer";
import { HTMLTransformer } from "./transformers/HTMLTransformer";
import { ExportErrorHandler } from "./errors/ErrorHandler";
import {
  createImportOptions,
  createImportResult,
  ImportOptions,
  ImportResult,
} from "./errors/ExportErrors";
import {
  formatFailedImportSummary,
  formatRecoverySummary,
} from "./errors/ErrorMessages";
import {
  detectExportVersionSafe,
  normalizeExportToV1,
  parseExportWithDetails,
  validateExportData,
} from "../../schemas/export";

export class BaseExporter {
  private transformers: Map<string, FormatTransformer> = new Map();

  constructor() {
    this.registerTransformer("markdown", new MarkdownTransformer());
    this.registerTransformer("rtf", new RTFTransformer());
    this.registerTransformer("docx", new DOCXTransformer());
    this.registerTransformer("html", new HTMLTransformer());
  }

  private registerTransformer(
    format: string,
    transformer: FormatTransformer,
  ): void {
    this.transformers.set(format, transformer);
  }

  async export(
    meeting: Meeting,
    options: ExportOptions,
  ): Promise<ExportResult> {
    const transformer = this.transformers.get(options.format);

    if (!transformer) {
      throw new Error(`Unsupported export format: ${options.format}`);
    }

    try {
      const result = await transformer.transform({ meeting, options });
      return result;
    } catch (error) {
      throw new Error(
        `Export failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async downloadFile(result: ExportResult): Promise<void> {
    try {
      let blob: Blob;

      // Handle different content types
      if (
        result.mimeType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        // DOCX content is base64 encoded
        const binaryString = atob(result.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: result.mimeType });
      } else {
        // Text-based content (markdown, RTF)
        blob = new Blob([result.content], { type: result.mimeType });
      }

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(
        `Download failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  getSupportedFormats(): string[] {
    return Array.from(this.transformers.keys());
  }

  generateDefaultFilename(meeting: Meeting, format: string): string {
    const date = meeting.date;
    const sanitizedTitle = meeting.title
      .slice(0, 30) // Limit to first 30 characters
      .replace(/[^a-zA-Z0-9-_\s]/g, "") // Remove special characters
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .toLowerCase()
      .trim(); // Remove any trailing whitespace

    // Use .md extension for markdown format
    const extension = format === "markdown" ? "md" : format;

    return `${sanitizedTitle}_${date}.${extension}`;
  }

  // Progressive import strategy - attempts to recover valid data from failed imports
  async importWithRecovery(
    file: File,
    _options: ImportOptions = createImportOptions(),
    onProgress?: (progress: number, status: string) => void,
    t?: (key: string, options?: Record<string, string | number>) => string,
  ): Promise<ImportResult> {
    const progressCallback = ExportErrorHandler.createProgressCallback(
      onProgress,
    );

    try {
      progressCallback(
        10,
        t ? t("import.progress.validating") : "Validating file...",
      );

      // Validate file before processing
      ExportErrorHandler.validateFileBeforeProcessing(file);

      progressCallback(
        20,
        t ? t("import.progress.reading_file") : "Reading file content...",
      );

      // Parse file content
      const data = await this.parseFile(file);

      progressCallback(
        40,
        t
          ? t("import.progress.validating_data")
          : "Validating data structure...",
      );

      // Validate the export data
      const validationResult = validateExportData(data);

      if (!validationResult.valid) {
        progressCallback(
          60,
          t
            ? t("import.progress.attempting_recovery")
            : "Attempting partial recovery...",
        );

        // Attempt partial import
        const partialResult = await ExportErrorHandler.attemptPartialImport(
          data,
          validationResult.errors || [],
        );

        progressCallback(
          80,
          t
            ? t("import.progress.finalizing_recovery")
            : "Finalizing recovery...",
        );

        const hasRecoveredData = partialResult.recoveredCount > 0;

        progressCallback(
          100,
          hasRecoveredData
            ? (t
              ? t("import.progress.partial_completed")
              : "Partial import completed")
            : (t ? t("import.progress.failed") : "Import failed"),
        );

        return createImportResult(false, {
          partialSuccess: hasRecoveredData,
          recoveredData: partialResult,
          errors: validationResult.errors || [],
          summary: hasRecoveredData
            ? (t
              ? formatRecoverySummary(
                partialResult.recoveredCount,
                partialResult.totalCount,
                t,
              )
              : `Recovered ${partialResult.recoveredCount} of ${partialResult.totalCount} items`)
            : (t
              ? formatFailedImportSummary(t)
              : "No valid data could be recovered"),
          failedItems: partialResult.totalCount - partialResult.recoveredCount,
          totalItems: partialResult.totalCount,
        });
      }

      progressCallback(
        60,
        t ? t("import.progress.processing_import") : "Processing import...",
      );

      // Successful validation - proceed with full import
      const normalizedData = normalizeExportToV1(validationResult.data);

      progressCallback(
        80,
        t ? t("import.progress.finalizing") : "Finalizing import...",
      );

      const result = createImportResult(true, {
        imported: normalizedData,
        summary:
          `Successfully imported ${normalizedData.meetings.length} meetings and ${normalizedData.attendees.length} attendees`,
        totalItems: normalizedData.meetings.length +
          normalizedData.attendees.length,
        failedItems: 0,
      });

      progressCallback(
        100,
        t
          ? t("import.progress.completed_successfully")
          : "Import completed successfully",
      );

      return result;
    } catch (error) {
      progressCallback(100, t ? t("import.progress.failed") : "Import failed");

      return ExportErrorHandler.handleImportError(error, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });
    }
  }

  // Parse file content safely
  private async parseFile(file: File): Promise<any> {
    const content = await this.readFileContent(file);
    return ExportErrorHandler.safeJsonParse(content);
  }

  // Read file content as text
  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("Failed to read file content"));
        }
      };

      reader.onerror = () => {
        reject(new Error("File reading error"));
      };

      reader.readAsText(file);
    });
  }

  // Enhanced import method with detailed error reporting
  async importWithDetails(
    file: File,
    _options: ImportOptions = createImportOptions(),
    t?: (key: string, options?: Record<string, string | number>) => string,
  ): Promise<ImportResult> {
    try {
      const data = await this.parseFile(file);
      const parseResult = parseExportWithDetails(data);

      if (parseResult.success) {
        const normalizedData = normalizeExportToV1(parseResult.data);

        return createImportResult(true, {
          imported: normalizedData,
          summary:
            `Successfully imported ${normalizedData.meetings.length} meetings and ${normalizedData.attendees.length} attendees`,
          totalItems: normalizedData.meetings.length +
            normalizedData.attendees.length,
          failedItems: 0,
          warnings: parseResult.warnings,
        });
      }

      // Handle partial recovery from the failure case
      const failureResult = parseResult as {
        success: false;
        errors: any[];
        partialData?: any;
        recoverable: boolean;
      };
      const partialResult = failureResult.partialData
        ? await ExportErrorHandler.attemptPartialImport(
          failureResult.partialData,
          failureResult.errors,
        )
        : null;

      return createImportResult(false, {
        partialSuccess: failureResult.recoverable && partialResult &&
          partialResult.recoveredCount > 0,
        recoveredData: partialResult,
        errors: failureResult.errors,
        summary: partialResult && partialResult.recoveredCount > 0
          ? (t
            ? formatRecoverySummary(
              partialResult.recoveredCount,
              partialResult.totalCount,
              t,
            )
            : `Recovered ${partialResult.recoveredCount} of ${partialResult.totalCount} items`)
          : (t
            ? formatFailedImportSummary(t)
            : "Import failed - no valid data found"),
        failedItems: partialResult
          ? partialResult.totalCount - partialResult.recoveredCount
          : 0,
        totalItems: partialResult ? partialResult.totalCount : 0,
      });
    } catch (error) {
      return ExportErrorHandler.handleImportError(error, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });
    }
  }

  // Version detection utility
  async detectFileVersion(file: File): Promise<{
    version: string | null;
    canMigrate: boolean;
    supportedVersions: string[];
    errors: any[];
  }> {
    try {
      const data = await this.parseFile(file);
      return detectExportVersionSafe(data);
    } catch (error) {
      return {
        version: null,
        canMigrate: false,
        supportedVersions: ["1.0.0", "legacy"],
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }
}
