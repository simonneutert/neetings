import { Meeting } from "../../../types/Meeting";
import { Block } from "../../../types/Block";
import { Attendee } from "../../../types/Attendee";
import { AttendeeUtils } from "../shared/AttendeeUtils";
import { MetadataGenerator } from "../shared/MetadataGenerator";
import { ContentStructure } from "../shared/ContentStructure";
import { BlockFormatter } from "../shared/BlockFormatter";

/**
 * RTF Generator utility for creating Rich Text Format documents
 * Handles RTF control codes, formatting, and character encoding
 */
export class RTFGenerator {
  /**
   * Generate complete RTF document from meeting data
   */
  generateDocument(
    meeting: Meeting,
    t?: (key: string) => string,
    language?: string,
    attendees?: Attendee[],
  ): string {
    const sections: string[] = [];

    // RTF header with font table and document settings - use UTF-8 compatible encoding
    sections.push(
      "{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang1033{\\fonttbl{\\f0\\froman\\fcharset0 Times New Roman;}{\\f1\\fswiss\\fcharset0 Arial;}}",
    );
    sections.push(
      "{\\colortbl ;\\red0\\green0\\blue0;\\red0\\green123\\blue255;}",
    );
    sections.push("\\viewkind4\\uc1\\pard\\f0\\fs22");

    // Title - large, bold, centered
    sections.push(
      `{\\pard\\qc\\f1\\fs32\\b ${this.escapeText(meeting.title)}\\par}`,
    );
    sections.push("\\par");

    // Metadata (created, modified, total blocks)
    sections.push(this.generateMetadata(meeting, t, language));
    sections.push("\\par");

    // Meeting Date & Time section
    sections.push(this.generateMeetingDateTime(meeting, t, language));
    sections.push("\\par");

    // Attendees
    const attendeesContent = this.generateAttendees(
      meeting,
      attendees,
      t,
      language,
    );
    if (attendeesContent) {
      sections.push(attendeesContent);
      sections.push("\\par");
    }

    // Table of Contents
    const tocContent = this.generateTableOfContents(meeting, t, language);
    if (tocContent) {
      sections.push(tocContent);
      sections.push("\\par");
    }

    // Content sections
    const contentSections = this.generateContentSections(meeting, t, language);
    sections.push(...contentSections);

    // RTF footer
    sections.push("}");

    return sections.join("\n");
  }

  /**
   * Generate metadata section
   */
  private generateMetadata(
    meeting: Meeting,
    t?: (key: string) => string,
    language?: string,
  ): string {
    const metadataString = MetadataGenerator.generateMetadataString(
      meeting,
      t,
      language,
    );
    return `{\\pard\\f0\\fs18\\i ${this.escapeText(metadataString)}\\par}`;
  }

  /**
   * Generate meeting date and time section
   */
  private generateMeetingDateTime(
    meeting: Meeting,
    t?: (key: string) => string,
    language?: string,
  ): string {
    const dateTime = MetadataGenerator.generateMeetingDateTime(
      meeting,
      t,
      language,
    );

    return `{\\pard\\f1\\fs22\\b ${this.escapeText(dateTime.date.label)}:\\b0 ${
      this.escapeText(dateTime.date.value)
    }\\par}{\\pard\\f1\\fs22\\b ${this.escapeText(dateTime.time.label)}:\\b0 ${
      this.escapeText(dateTime.time.value)
    }\\par}`;
  }

  /**
   * Generate attendees section
   */
  private generateAttendees(
    meeting: Meeting,
    attendees?: Attendee[],
    t?: (key: string) => string,
    _language?: string,
  ): string | null {
    const meetingAttendees = AttendeeUtils.getMeetingAttendeesOrNull(
      attendees || [],
      meeting,
    );

    if (!meetingAttendees) {
      return null;
    }

    const attendeesTitle = AttendeeUtils.getAttendeesLabelWithCount(
      meetingAttendees.length,
      t,
    );
    const attendeesList = meetingAttendees.map((attendee) => {
      const name = AttendeeUtils.formatAttendeeName(attendee);
      return `{\\pard\\f0\\fs20 \\bullet  ${this.escapeText(name)}\\par}`;
    });

    return `{\\pard\\f1\\fs24\\b ${this.escapeText(attendeesTitle)}\\par}${
      attendeesList.join("")
    }`;
  }

  /**
   * Generate table of contents
   */
  private generateTableOfContents(
    meeting: Meeting,
    t?: (key: string) => string,
    _language?: string,
  ): string | null {
    const tocEntries = ContentStructure.generateTableOfContentsEntries(
      meeting,
      t,
    );

    if (!tocEntries) {
      return null;
    }

    const tocItems = tocEntries.map((entry) =>
      `{\\pard\\f0\\fs20 \\bullet  ${this.escapeText(entry.name)}\\par}`
    );

    const tocTitle = ContentStructure.getTableOfContentsTitle(t);

    return `{\\pard\\f1\\fs24\\b ${this.escapeText(tocTitle)}\\par}${
      tocItems.join("")
    }`;
  }

  /**
   * Generate content sections
   */
  private generateContentSections(
    meeting: Meeting,
    t?: (key: string) => string,
    language?: string,
  ): string[] {
    const sections: string[] = [];
    const organizedSections = ContentStructure.getOrganizedContentSections(
      meeting,
    );

    for (const section of organizedSections) {
      if (section.topicGroup) {
        // Named topic group section
        sections.push(
          `{\\pard\\f1\\fs24\\b ${
            this.escapeText(section.topicGroup.name)
          }\\par}`,
        );
      } else if (ContentStructure.hasTopicGroups(meeting)) {
        // Main Agenda section (when topic groups exist)
        const mainAgendaTitle = ContentStructure.getMainAgendaTitle(t);
        sections.push(
          `{\\pard\\f1\\fs24\\b ${this.escapeText(mainAgendaTitle)}\\par}`,
        );
      } else {
        // General blocks section (no topic groups at all)
        const blocksTitle = ContentStructure.getBlocksLabel(t);
        sections.push(
          `{\\pard\\f1\\fs24\\b ${this.escapeText(blocksTitle)}\\par}`,
        );
      }

      if (section.isEmpty) {
        const noBlocksText = ContentStructure.getNoBlocksText(t);
        sections.push(
          `{\\pard\\f0\\fs18\\i ${this.escapeText(noBlocksText)}\\par}`,
        );
      } else {
        sections.push(this.generateBlocks(section.blocks, t, language));
      }
    }

    return sections;
  }

  /**
   * Generate RTF content for blocks
   */
  private generateBlocks(
    blocks: Block[],
    t?: (key: string) => string,
    language?: string,
  ): string {
    const content: string[] = [];
    const formattedBlocks = BlockFormatter.getFormattedBlocks(
      blocks,
      t,
      language,
    );

    for (const blockData of formattedBlocks) {
      const blockContent = this.formatBlockFromData(blockData);
      content.push(blockContent);
      content.push("\\par");
    }

    return content.join("");
  }

  /**
   * Format individual block content from structured block data
   */
  private formatBlockFromData(blockData: any): string {
    const label = blockData.label;

    switch (blockData.type) {
      case "textblock":
        return `{\\pard\\f1\\fs20\\b [${
          this.escapeText(label)
        }]\\par}{\\pard\\f0\\fs20 ${
          this.escapeText(blockData.content.text)
        }\\par}`;

      case "qandablock":
        return `{\\pard\\f1\\fs20\\b [${
          this.escapeText(label)
        }]\\par}{\\pard\\f0\\fs20\\b ${
          this.escapeText(blockData.content.question.label)
        }:\\b0 ${
          this.escapeText(blockData.content.question.value)
        }\\par}{\\pard\\f0\\fs20\\b ${
          this.escapeText(blockData.content.answer.label)
        }:\\b0 ${this.escapeText(blockData.content.answer.value)}\\par}`;

      case "researchblock":
        return `{\\pard\\f1\\fs20\\b [${
          this.escapeText(label)
        }]\\par}{\\pard\\f0\\fs20\\b ${
          this.escapeText(blockData.content.topic.label)
        }:\\b0 ${
          this.escapeText(blockData.content.topic.value)
        }\\par}{\\pard\\f0\\fs20\\b ${
          this.escapeText(blockData.content.result.label)
        }:\\b0 ${this.escapeText(blockData.content.result.value)}\\par}`;

      case "factblock":
        return `{\\pard\\f1\\fs20\\b [${
          this.escapeText(label)
        }]\\par}{\\pard\\f0\\fs20 ${
          this.escapeText(blockData.content.fact)
        }\\par}`;

      case "decisionblock":
        return `{\\pard\\f1\\fs20\\b [${
          this.escapeText(label)
        }]\\par}{\\pard\\f0\\fs20 ${
          this.escapeText(blockData.content.decision)
        }\\par}`;

      case "issueblock":
        return `{\\pard\\f1\\fs20\\b [${
          this.escapeText(label)
        }]\\par}{\\pard\\f0\\fs20 ${
          this.escapeText(blockData.content.issue)
        }\\par}`;

      case "todoblock":
        return `{\\pard\\f1\\fs20\\b [${
          this.escapeText(label)
        }]\\par}{\\pard\\f0\\fs20 ${
          this.escapeText(
            `${blockData.content.checkbox} ${blockData.content.todo}`,
          )
        }\\par}`;

      case "goalblock":
        return `{\\pard\\f1\\fs20\\b [${
          this.escapeText(label)
        }]\\par}{\\pard\\f0\\fs20 ${
          this.escapeText(blockData.content.goal)
        }\\par}`;

      case "followupblock":
        return `{\\pard\\f1\\fs20\\b [${
          this.escapeText(label)
        }]\\par}{\\pard\\f0\\fs20 ${
          this.escapeText(blockData.content.followup)
        }\\par}`;

      case "ideablock":
        return `{\\pard\\f1\\fs20\\b [${
          this.escapeText(label)
        }]\\par}{\\pard\\f0\\fs20 ${
          this.escapeText(blockData.content.idea)
        }\\par}`;

      case "referenceblock":
        return `{\\pard\\f1\\fs20\\b [${
          this.escapeText(label)
        }]\\par}{\\pard\\f0\\fs20 ${
          this.escapeText(blockData.content.reference)
        }\\par}`;

      default:
        return `{\\pard\\f1\\fs20\\b [${
          this.escapeText(label)
        }]\\par}{\\pard\\f0\\fs20 ${
          this.escapeText(blockData.content.raw)
        }\\par}`;
    }
  }

  /**
   * Escape RTF special characters and handle Unicode
   */
  private escapeText(text: string): string {
    if (typeof text !== "string") {
      return "";
    }

    // First handle RTF control characters
    let escaped = text
      .replace(/\\/g, "\\\\")
      .replace(/{/g, "\\{")
      .replace(/}/g, "\\}")
      .replace(/\n/g, "\\par ")
      .replace(/\r/g, "");

    // Handle Unicode characters by converting to RTF Unicode codes
    escaped = escaped.replace(/[\u0080-\uFFFF]/g, (match) => {
      const code = match.charCodeAt(0);
      return `\\u${code}?`;
    });

    return escaped;
  }
}
