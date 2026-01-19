import { Meeting } from "../../../types/Meeting";
import { Block, getBlockFieldValue } from "../../../types/Block";
import { Attendee } from "../../../types/Attendee";
import {
  ExportOptions,
  ExportResult,
  FormatTransformer,
} from "../types/ExportTypes";
import {
  getLocalizedBlockLabel,
  getLocalizedFieldLabel,
} from "../../translation";
import {
  AlignmentType,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  TableOfContents,
  TextRun,
} from "docx";

/**
 * DOCX transformer using the browser-compatible docx library
 * Generates proper DOCX files that can be opened in Microsoft Word
 */
export class DOCXTransformer extends FormatTransformer {
  async transform(
    data: { meeting: Meeting; options: ExportOptions },
  ): Promise<ExportResult> {
    const { meeting, options } = data;

    try {
      const document = this.generateDocxDocument(
        meeting,
        options.t,
        options.language,
        options.attendees,
      );
      // Use browser-compatible blob generation instead of toBuffer
      const blob = await Packer.toBlob(document);

      // Convert blob to base64 for consistent handling
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binaryString = "";
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }
      const content = btoa(binaryString);

      const filename = this.ensureDocxExtension(options.filename);

      return {
        content,
        filename,
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };
    } catch (error) {
      throw new Error(
        `DOCX export failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Generates a proper DOCX document using the docx library
   */
  private generateDocxDocument(
    meeting: Meeting,
    t?: (key: string) => string,
    language?: string,
    attendees?: Attendee[],
  ): Document {
    const sections: any[] = [];

    // Document title
    sections.push(
      new Paragraph({
        text: meeting.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      }),
    );

    // Metadata section (created, modified, total blocks)
    sections.push(...this.generateMetadataParagraphs(meeting, t, language));

    // Meeting Date & Time section
    sections.push(
      ...this.generateMeetingDateTimeParagraphs(meeting, t, language),
    );

    // Attendees section
    const attendeesParagraphs = this.generateAttendeesParagraphs(
      meeting,
      attendees,
      t,
      language,
    );
    if (attendeesParagraphs.length > 0) {
      sections.push(...attendeesParagraphs);
    }

    // Table of contents (if topic groups exist)
    if (meeting.topicGroups && meeting.topicGroups.length > 0) {
      sections.push(
        new TableOfContents("Table of Contents", {
          hyperlink: true,
          headingStyleRange: "1-3",
        }),
      );
    }

    // Content sections
    sections.push(...this.generateContentParagraphs(meeting, t, language));

    // Create document with header and footer
    return new Document({
      sections: [
        {
          properties: {},
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: meeting.title,
                      size: 24,
                      bold: true,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${
                        this.generateFooterText(meeting, t, language)
                      } - Page `,
                      size: 18,
                    }),
                    PageNumber.CURRENT,
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          },
          children: sections,
        },
      ],
    });
  }

  /**
   * Generates metadata paragraphs for the document (created, modified, total blocks)
   */
  private generateMetadataParagraphs(
    meeting: Meeting,
    t?: (key: string) => string,
    language?: string,
  ): Paragraph[] {
    const createdDate = this.formatLocalizedDateTime(
      meeting.created_at,
      language,
    );
    const modifiedDate = this.formatLocalizedDateTime(
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

    return [
      new Paragraph({
        children: [
          new TextRun({
            text:
              `${createdLabel}: ${createdDate} | ${modifiedLabel}: ${modifiedDate} | ${blocksLabel}: ${totalBlocks}`,
            size: 20,
            italics: true,
            color: "6c757d",
          }),
        ],
        spacing: { after: 200 },
      }),
    ];
  }

  /**
   * Generates meeting date and time paragraphs for the document
   */
  private generateMeetingDateTimeParagraphs(
    meeting: Meeting,
    t?: (key: string) => string,
    language?: string,
  ): Paragraph[] {
    const meetingDate = this.formatLocalizedDate(meeting.date, language);
    const startTime = meeting.startTime;
    const endTime = meeting.endTime;

    const dateLabel = t ? t("importExport.content.date") || "Date" : "Date";
    const timeLabel = t ? t("importExport.content.time") || "Time" : "Time";

    return [
      new Paragraph({
        children: [
          new TextRun({
            text: `${dateLabel}: `,
            size: 22,
            bold: true,
            color: "1976d2",
          }),
          new TextRun({
            text: meetingDate,
            size: 22,
            color: "495057",
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `${timeLabel}: `,
            size: 22,
            bold: true,
            color: "1976d2",
          }),
          new TextRun({
            text: `${startTime} - ${endTime}`,
            size: 22,
            color: "495057",
          }),
        ],
        spacing: { after: 200 },
      }),
    ];
  }

  /**
   * Generates attendees paragraphs for the document
   */
  private generateAttendeesParagraphs(
    meeting: Meeting,
    attendees?: Attendee[],
    t?: (key: string) => string,
    _language?: string,
  ): Paragraph[] {
    if (
      !attendees || attendees.length === 0 || !meeting.attendeeIds ||
      meeting.attendeeIds.length === 0
    ) {
      return [];
    }

    // Filter attendees to only include those assigned to this meeting
    const meetingAttendees = attendees.filter((a) =>
      meeting.attendeeIds.includes(a.id)
    );

    if (meetingAttendees.length === 0) {
      return [];
    }

    const attendeesTitle = this.getAttendeesLabelWithCount(
      meetingAttendees.length,
      t,
    );
    const paragraphs: Paragraph[] = [];

    // Attendees section header
    paragraphs.push(
      new Paragraph({
        text: attendeesTitle,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
    );

    // Attendees list
    meetingAttendees.forEach((attendee) => {
      const attendeeText = attendee.email
        ? `${attendee.name} (${attendee.email})`
        : attendee.name;
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${attendeeText}`,
              size: 22,
            }),
          ],
          spacing: { after: 50 },
        }),
      );
    });

    // Add spacing after attendees section
    paragraphs.push(
      new Paragraph({
        text: "",
        spacing: { after: 200 },
      }),
    );

    return paragraphs;
  }

  /**
   * Generates content paragraphs for the document
   */
  private generateContentParagraphs(
    meeting: Meeting,
    t?: (key: string) => string,
    language?: string,
  ): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    if (!meeting.topicGroups || meeting.topicGroups.length === 0) {
      // No topic groups - show all blocks
      if (meeting.blocks.length > 0) {
        const blocksTitle = t ? t("importExport.content.blocks") : "Blocks";
        paragraphs.push(
          new Paragraph({
            text: blocksTitle,
            heading: HeadingLevel.HEADING_1,
          }),
        );
        paragraphs.push(
          ...this.generateBlockParagraphs(meeting.blocks, t, language),
        );
      }
    } else {
      // Sort topic groups by order
      const sortedTopicGroups = [...meeting.topicGroups].sort((a, b) =>
        a.order - b.order
      );

      for (const topicGroup of sortedTopicGroups) {
        paragraphs.push(
          new Paragraph({
            text: topicGroup.name,
            heading: HeadingLevel.HEADING_1,
          }),
        );

        const topicBlocks = meeting.blocks
          .filter((block) => block.topicGroupId === topicGroup.id)
          .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

        if (topicBlocks.length > 0) {
          paragraphs.push(
            ...this.generateBlockParagraphs(topicBlocks, t, language),
          );
        } else {
          const noBlocksText = t
            ? t("importExport.content.noBlocksInSection")
            : "No blocks in this section";
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: noBlocksText,
                  italics: true,
                  color: "6c757d",
                }),
              ],
              spacing: { after: 200 },
            }),
          );
        }
      }
    }

    return paragraphs;
  }

  /**
   * Generates paragraphs for a list of blocks
   */
  private generateBlockParagraphs(
    blocks: Block[],
    t?: (key: string) => string,
    language?: string,
  ): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    for (const block of blocks) {
      paragraphs.push(...this.formatBlockParagraphs(block, t, language));
    }

    return paragraphs;
  }

  /**
   * Formats a single block as DOCX paragraphs
   */
  private formatBlockParagraphs(
    block: Block,
    t?: (key: string) => string,
    language?: string,
  ): Paragraph[] {
    const label = getLocalizedBlockLabel(block.type, t, language);
    const paragraphs: Paragraph[] = [];

    // Block header
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `[${label}]`,
            bold: true,
            size: 22,
            color: this.getBlockTypeColor(block.type),
          }),
        ],
        spacing: { before: 200, after: 100 },
      }),
    );

    // Block content
    switch (block.type) {
      case "textblock":
        paragraphs.push(
          new Paragraph({
            children: this.createTextRunsWithLineBreaks(
              getBlockFieldValue(block, "text"),
              { size: 22 },
            ),
          }),
        );
        break;

      case "qandablock": {
        const question = getBlockFieldValue(block, "question");
        const answer = getBlockFieldValue(block, "answer");
        const questionLabel = getLocalizedFieldLabel("question", t);
        const answerLabel = getLocalizedFieldLabel("answer", t);

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${questionLabel}: `, bold: true, size: 22 }),
              ...this.createTextRunsWithLineBreaks(question, { size: 22 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `${answerLabel}: `, bold: true, size: 22 }),
              ...this.createTextRunsWithLineBreaks(answer, { size: 22 }),
            ],
          }),
        );
        break;
      }

      case "researchblock": {
        const topic = getBlockFieldValue(block, "topic");
        const result = getBlockFieldValue(block, "result");
        const topicLabel = getLocalizedFieldLabel("topic", t);
        const resultLabel = getLocalizedFieldLabel("result", t);

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${topicLabel}: `, bold: true, size: 22 }),
              ...this.createTextRunsWithLineBreaks(topic, { size: 22 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `${resultLabel}: `, bold: true, size: 22 }),
              ...this.createTextRunsWithLineBreaks(result, { size: 22 }),
            ],
          }),
        );
        break;
      }

      case "todoblock": {
        const todoText = getBlockFieldValue(block, "todo");
        const checkbox = block.completed ? "☑" : "☐";
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${checkbox} `, size: 22 }),
              ...this.createTextRunsWithLineBreaks(todoText, { size: 22 }),
            ],
          }),
        );
        break;
      }

      default: {
        const fieldValue = this.getDefaultBlockContent(block);
        paragraphs.push(
          new Paragraph({
            children: this.createTextRunsWithLineBreaks(fieldValue, {
              size: 22,
            }),
          }),
        );
      }
    }

    return paragraphs;
  }

  /**
   * Gets block type color for styling
   */
  private getBlockTypeColor(blockType: string): string {
    const colorMap: Record<string, string> = {
      textblock: "1976D2",
      qandablock: "7B1FA2",
      researchblock: "388E3C",
      factblock: "F57C00",
      decisionblock: "D32F2F",
      issueblock: "C2185B",
      todoblock: "689F38",
      goalblock: "00796B",
      followupblock: "0288D1",
      ideablock: "827717",
      referenceblock: "424242",
    };
    return colorMap[blockType] || "000000";
  }

  /**
   * Gets the default content for block types
   */
  private getDefaultBlockContent(block: Block): string {
    const fieldMap: Record<string, string> = {
      factblock: "fact",
      decisionblock: "decision",
      issueblock: "issue",
      goalblock: "goal",
      followupblock: "followup",
      ideablock: "idea",
      referenceblock: "reference",
    };

    const field = fieldMap[block.type];
    return field
      ? getBlockFieldValue(block, field as any)
      : JSON.stringify(block);
  }

  /**
   * Helper function to create TextRuns with line breaks
   * Splits text on \n and creates separate TextRuns with line breaks
   */
  private createTextRunsWithLineBreaks(text: string, styling: any): TextRun[] {
    if (typeof text !== "string") {
      return [new TextRun({ text: "", ...styling })];
    }

    const lines = text.split("\n");
    const runs: TextRun[] = [];

    lines.forEach((line, index) => {
      runs.push(new TextRun({ text: line, ...styling }));
      if (index < lines.length - 1) {
        runs.push(new TextRun({ text: "", break: 1 })); // Line break
      }
    });

    return runs;
  }

  /**
   * Generates footer text for the document
   */
  private generateFooterText(
    meeting: Meeting,
    t?: (key: string) => string,
    language?: string,
  ): string {
    const exportedLabel = t
      ? t("importExport.content.exported") || "Exported"
      : "Exported";
    const fromLabel = t ? t("importExport.content.from") || "from" : "from";
    const appName = "Neetings";
    const exportDate = this.formatLocalizedDateTime(
      new Date().toISOString(),
      language,
    );

    return `${exportedLabel} ${fromLabel} ${appName} - ${exportDate}`;
  }

  /**
   * Ensures the filename has .docx extension
   */
  private ensureDocxExtension(filename: string): string {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    return `${nameWithoutExt}.docx`;
  }

  /**
   * Gets attendees label with proper count interpolation
   */
  private getAttendeesLabelWithCount(
    count: number,
    t?: (key: string) => string,
  ): string {
    if (t) {
      const template = t("importExport.content.attendeesWithCount");
      return template.replace("{{count}}", count.toString());
    }
    return `Attendees (${count})`;
  }

  /**
   * Formats date with localization
   */
  private formatLocalizedDate(date: string, language?: string): string {
    const d = new Date(date);
    const locale = language === "de" ? "de-DE" : "en-US";
    return d.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}
