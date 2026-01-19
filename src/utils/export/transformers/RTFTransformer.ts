import { Meeting } from "../../../types/Meeting";
import {
  ExportOptions,
  ExportResult,
  FormatTransformer,
} from "../types/ExportTypes";
import { RTFGenerator } from "../rtf/RTFGenerator";

/**
 * RTF (Rich Text Format) transformer
 * Creates RTF documents using the dedicated RTFGenerator utility
 */
export class RTFTransformer extends FormatTransformer {
  private rtfGenerator: RTFGenerator;

  constructor() {
    super();
    this.rtfGenerator = new RTFGenerator();
  }

  async transform(
    data: { meeting: Meeting; options: ExportOptions },
  ): Promise<ExportResult> {
    const { meeting, options } = data;

    try {
      // Generate RTF content using dedicated utility
      const rtfContent = this.rtfGenerator.generateDocument(
        meeting,
        options.t,
        options.language,
        options.attendees,
      );

      const filename = this.ensureRtfExtension(options.filename);

      return {
        content: rtfContent,
        filename,
        mimeType: "application/rtf",
      };
    } catch (error) {
      throw new Error(
        `RTF export failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Ensures the filename has .rtf extension
   */
  private ensureRtfExtension(filename: string): string {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    return `${nameWithoutExt}.rtf`;
  }
}
