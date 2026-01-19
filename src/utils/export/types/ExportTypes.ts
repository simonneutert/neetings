import { Attendee } from "../../../types/Attendee";

export interface ExportOptions {
  format: "markdown" | "rtf" | "docx" | "html";
  filename: string;
  t?: (key: string) => string; // Translation function for localized content
  language?: string; // Current language for explicit localization
  attendees?: Attendee[]; // Attendee data for resolving attendeeIds
}

export interface ExportResult {
  content: string;
  filename: string;
  mimeType: string;
}

export interface ExportMetadata {
  createdAt: string;
  lastModified: string;
  totalBlocks: number;
}

export abstract class FormatTransformer {
  abstract transform(
    data: { meeting: any; options: ExportOptions },
  ): Promise<ExportResult>;

  protected sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9-_\s]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();
  }

  protected formatLocalizedDateTime(date: string, language?: string): string {
    const d = new Date(date);

    // Use native toLocaleString with locale parameter (matches existing codebase pattern)
    const locale = language === "de" ? "de-DE" : "en-US";
    return d.toLocaleString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
}
