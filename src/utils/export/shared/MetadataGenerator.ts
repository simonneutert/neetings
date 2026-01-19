import { Meeting } from "../../../types/Meeting";
import { DateFormatter } from "./DateFormatter";

/**
 * Shared metadata generation utilities for export transformers
 * Provides consistent metadata across all export formats
 */
export class MetadataGenerator {
  /**
   * Generate metadata object with all standard fields
   */
  static generateMetadata(
    meeting: Meeting,
    t?: (key: string) => string,
    language?: string,
  ) {
    const createdDate = DateFormatter.formatLocalizedDateTime(
      meeting.created_at,
      language,
    );
    const modifiedDate = DateFormatter.formatLocalizedDateTime(
      meeting.updated_at,
      language,
    );
    const totalBlocks = meeting.blocks.length;

    const createdLabel = t ? t("importExport.content.created") : "Created";
    const modifiedLabel = t
      ? t("importExport.content.lastModified")
      : "Last Modified";
    const blocksLabel = t
      ? t("importExport.content.totalBlocks")
      : "Total Blocks";

    return {
      created: {
        label: createdLabel,
        value: createdDate,
      },
      modified: {
        label: modifiedLabel,
        value: modifiedDate,
      },
      totalBlocks: {
        label: blocksLabel,
        value: totalBlocks,
      },
    };
  }

  /**
   * Generate metadata string in common format
   */
  static generateMetadataString(
    meeting: Meeting,
    t?: (key: string) => string,
    language?: string,
  ): string {
    const metadata = this.generateMetadata(meeting, t, language);
    return `${metadata.created.label}: ${metadata.created.value} | ${metadata.modified.label}: ${metadata.modified.value} | ${metadata.totalBlocks.label}: ${metadata.totalBlocks.value}`;
  }

  /**
   * Generate meeting date and time information
   */
  static generateMeetingDateTime(
    meeting: Meeting,
    t?: (key: string) => string,
    language?: string,
  ) {
    const meetingDate = DateFormatter.formatLocalizedDate(
      meeting.date,
      language,
    );
    const timeRange = DateFormatter.formatMeetingTimeRange(
      meeting.startTime,
      meeting.endTime,
    );

    const dateLabel = t ? t("importExport.content.date") || "Date" : "Date";
    const timeLabel = t ? t("importExport.content.time") || "Time" : "Time";

    return {
      date: {
        label: dateLabel,
        value: meetingDate,
      },
      time: {
        label: timeLabel,
        value: timeRange,
      },
    };
  }
}
