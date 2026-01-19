import { Meeting } from "../../../types/Meeting";
import { Block } from "../../../types/Block";
import { Attendee } from "../../../types/Attendee";
import {
  ExportOptions,
  ExportResult,
  FormatTransformer,
} from "../types/ExportTypes";
import { AttendeeUtils } from "../shared/AttendeeUtils";
import { MetadataGenerator } from "../shared/MetadataGenerator";
import { ContentStructure } from "../shared/ContentStructure";
import { BlockFormatter } from "../shared/BlockFormatter";

export class MarkdownTransformer extends FormatTransformer {
  async transform(
    data: { meeting: Meeting; options: ExportOptions },
  ): Promise<ExportResult> {
    const { meeting, options } = data;

    const content = this.generateMarkdownContent(
      meeting,
      options.t,
      options.language,
      options.attendees,
    );

    return {
      content,
      filename: options.filename,
      mimeType: "text/markdown",
    };
  }

  private generateMarkdownContent(
    meeting: Meeting,
    t?: (key: string) => string,
    language?: string,
    attendees?: Attendee[],
  ): string {
    const sections: string[] = [];

    // Title
    sections.push(`# ${meeting.title}`);
    sections.push("");

    // Metadata (created, modified, total blocks)
    sections.push(this.generateMetadata(meeting, t, language));
    sections.push("");

    // Meeting Date & Time section
    sections.push(this.generateMeetingDateTime(meeting, t, language));
    sections.push("");

    // Attendees
    const attendeesContent = this.generateAttendees(
      meeting,
      attendees,
      t,
      language,
    );
    if (attendeesContent) {
      sections.push(attendeesContent);
      sections.push("");
    }

    // Table of Contents
    const tocContent = this.generateTableOfContents(meeting, t, language);
    if (tocContent) {
      sections.push(tocContent);
      sections.push("");
    }

    // Content sections
    const contentSections = this.generateContentSections(meeting, t, language);
    sections.push(...contentSections);

    return sections.join("\n");
  }

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
    return `*${metadataString}*`;
  }

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
    return `**${dateTime.date.label}:** ${dateTime.date.value}  \n**${dateTime.time.label}:** ${dateTime.time.value}`;
  }

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
      return `- ${name}`;
    });

    return [
      `## ${attendeesTitle}`,
      ...attendeesList,
    ].join("\n");
  }

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

    const tocItems = tocEntries.map((entry) => {
      const anchor = BlockFormatter.generateAnchor(entry.name);
      return `- [${entry.name}](#${anchor})`;
    });

    const tocTitle = ContentStructure.getTableOfContentsTitle(t);

    return [
      `## ${tocTitle}`,
      ...tocItems,
    ].join("\n");
  }

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
        sections.push(`## ${section.topicGroup.name}`);
      } else if (ContentStructure.hasTopicGroups(meeting)) {
        // Main Agenda section (when topic groups exist)
        const mainAgendaTitle = ContentStructure.getMainAgendaTitle(t);
        sections.push(`## ${mainAgendaTitle}`);
      } else {
        // General blocks section (no topic groups at all)
        const blocksTitle = ContentStructure.getBlocksLabel(t);
        sections.push(`## ${blocksTitle}`);
      }
      sections.push("");

      if (section.isEmpty) {
        const noBlocksText = ContentStructure.getNoBlocksText(t);
        sections.push(`*${noBlocksText}*`);
        sections.push("");
      } else {
        const blockContent = this.generateBlocksContent(
          section.blocks,
          t,
          language,
        );
        sections.push(...blockContent);
      }
    }

    return sections;
  }

  private generateBlocksContent(
    blocks: Block[],
    t?: (key: string) => string,
    language?: string,
  ): string[] {
    const content: string[] = [];
    const formattedBlocks = BlockFormatter.getFormattedBlocks(
      blocks,
      t,
      language,
    );

    for (const blockData of formattedBlocks) {
      const blockContent = this.formatBlockFromData(blockData);
      content.push(blockContent);
      content.push("");
    }

    return content;
  }

  /**
   * Smart markdown line break handling
   * Converts single \n to hard line breaks (two spaces + \n)
   * Leaves double \n\n as paragraph breaks (unchanged)
   */
  private formatMarkdownText(text: string): string {
    if (typeof text !== "string") {
      return "";
    }

    // Convert single \n to two spaces + \n (hard line break within paragraph)
    // But only when NOT preceded by \n and NOT followed by \n (to preserve \n\n)
    return text.replace(/(?<!\n)\n(?!\n)/g, "  \n");
  }

  private formatBlockFromData(blockData: any): string {
    const label = blockData.label;

    switch (blockData.type) {
      case "textblock":
        return `**[${label}]**\n${
          this.formatMarkdownText(blockData.content.text)
        }`;

      case "qandablock":
        return `**[${label}]**\n${blockData.content.question.label}: ${
          this.formatMarkdownText(blockData.content.question.value)
        }\n${blockData.content.answer.label}: ${
          this.formatMarkdownText(blockData.content.answer.value)
        }`;

      case "researchblock":
        return `**[${label}]**\n${blockData.content.topic.label}: ${
          this.formatMarkdownText(blockData.content.topic.value)
        }\n${blockData.content.result.label}: ${
          this.formatMarkdownText(blockData.content.result.value)
        }`;

      case "factblock":
        return `**[${label}]**\n${
          this.formatMarkdownText(blockData.content.fact)
        }`;

      case "decisionblock":
        return `**[${label}]**\n${
          this.formatMarkdownText(blockData.content.decision)
        }`;

      case "issueblock":
        return `**[${label}]**\n${
          this.formatMarkdownText(blockData.content.issue)
        }`;

      case "todoblock":
        return `**[${label}]**\n${
          blockData.content.checkbox === "[X]" ? "- [x]" : "- [ ]"
        } ${this.formatMarkdownText(blockData.content.todo)}`;

      case "goalblock":
        return `**[${label}]**\n${
          this.formatMarkdownText(blockData.content.goal)
        }`;

      case "followupblock":
        return `**[${label}]**\n${
          this.formatMarkdownText(blockData.content.followup)
        }`;

      case "ideablock":
        return `**[${label}]**\n${
          this.formatMarkdownText(blockData.content.idea)
        }`;

      case "referenceblock":
        return `**[${label}]**\n${
          this.formatMarkdownText(blockData.content.reference)
        }`;

      default:
        return `**[${label}]**\n${
          this.formatMarkdownText(blockData.content.raw)
        }`;
    }
  }
}
