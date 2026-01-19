/**
 * Shared date formatting utilities for export transformers
 * Eliminates duplication across MarkdownTransformer, HTMLGenerator, DOCXTransformer, and RTFGenerator
 */
export class DateFormatter {
  /**
   * Format date with localization for display
   */
  static formatLocalizedDate(date: string, language?: string): string {
    const d = new Date(date);
    const locale = language === "de" ? "de-DE" : "en-US";
    return d.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /**
   * Format date time with localization for display
   */
  static formatLocalizedDateTime(date: string, language?: string): string {
    const d = new Date(date);
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

  /**
   * Format date for filename generation (YYYY-MM-DD)
   */
  static formatDateForFilename(date: Date = new Date()): string {
    return date.toISOString().split("T")[0];
  }

  /**
   * Format meeting date and time range for display
   */
  static formatMeetingTimeRange(startTime: string, endTime: string): string {
    return `${startTime} - ${endTime}`;
  }
}
