import { Meeting } from "../../../types/Meeting";
import {
  ExportOptions,
  ExportResult,
  FormatTransformer,
} from "../types/ExportTypes";
import { createExportV1 } from "../../../schemas/export";

export class JSONTransformer extends FormatTransformer {
  async transform(
    data: { meeting: Meeting; options: ExportOptions },
  ): Promise<ExportResult> {
    const { meeting, options } = data;

    const attendees = options.attendees || [];

    const exportData = createExportV1(
      [meeting],
      attendees,
      meeting.title,
      "",
    );

    const content = JSON.stringify(exportData, null, 2);

    return {
      content,
      filename: this.ensureJsonExtension(options.filename),
      mimeType: "application/json",
    };
  }

  private ensureJsonExtension(filename: string): string {
    if (filename.endsWith(".json")) {
      return filename;
    }
    // Replace existing extension or append .json
    const dotIndex = filename.lastIndexOf(".");
    if (dotIndex > 0) {
      return `${filename.substring(0, dotIndex)}.json`;
    }
    return `${filename}.json`;
  }
}
