import { Meeting } from "../../../types/Meeting";
import {
  ExportOptions,
  ExportResult,
  FormatTransformer,
} from "../types/ExportTypes";
import { HTMLGenerator } from "./HTMLGenerator";

/**
 * HTML transformer for standalone HTML file exports
 * Uses the existing HTMLGenerator to create complete HTML documents
 */
export class HTMLTransformer extends FormatTransformer {
  private htmlGenerator: HTMLGenerator;

  constructor() {
    super();
    this.htmlGenerator = new HTMLGenerator();
  }

  async transform(
    data: { meeting: Meeting; options: ExportOptions },
  ): Promise<ExportResult> {
    const { meeting, options } = data;

    try {
      // Generate complete HTML document using our existing HTML generator
      const htmlContent = this.htmlGenerator.generateHTML(
        meeting,
        options.t,
        options.language,
        options.attendees,
      );

      const filename = this.ensureHtmlExtension(options.filename);

      return {
        content: htmlContent,
        filename,
        mimeType: "text/html",
      };
    } catch (error) {
      throw new Error(
        `HTML export failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Ensures the filename has .html extension
   */
  private ensureHtmlExtension(filename: string): string {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    return `${nameWithoutExt}.html`;
  }
}
