import { Meeting } from "../../../types/Meeting";
import { Block, getBlockFieldValue } from "../../../types/Block";
import { Attendee } from "../../../types/Attendee";
import {
  getLocalizedBlockLabel,
  getLocalizedFieldLabel,
} from "../../translation";

/**
 * Shared HTML generation utility for rich text exports (RTF, DOCX)
 * Converts meeting data to structured HTML that can be transformed by format-specific libraries
 */
export class HTMLGenerator {
  /**
   * Generates complete HTML document from meeting data
   */
  generateHTML(
    meeting: Meeting,
    t?: (key: string) => string,
    language?: string,
    attendees?: Attendee[],
  ): string {
    const sections: string[] = [];

    // Document structure
    sections.push("<!DOCTYPE html>");
    sections.push(`<html lang="${language || "en"}">`);
    sections.push("<head>");
    sections.push('<meta charset="UTF-8">');
    sections.push(this.generateStyles());
    sections.push("</head>");
    sections.push("<body>");

    // Title
    sections.push(
      `<h1 class="meeting-title">${this.escapeHtml(meeting.title)}</h1>`,
    );

    // Metadata (created, modified, total blocks)
    sections.push(this.generateMetadataHTML(meeting, t, language));

    // Meeting Date & Time section
    sections.push(this.generateMeetingDateTimeHTML(meeting, t, language));

    // Attendees section (as proper list)
    const attendeesHTML = this.generateAttendeesHTML(
      meeting,
      attendees,
      t,
      language,
    );
    if (attendeesHTML) {
      sections.push(attendeesHTML);
    }

    // Table of Contents
    const tocHTML = this.generateTableOfContentsHTML(meeting, t, language);
    if (tocHTML) {
      sections.push(tocHTML);
    }

    // Content sections
    sections.push(this.generateContentSectionsHTML(meeting, t, language));

    sections.push("</body>");
    sections.push("</html>");

    return sections.join("\n");
  }

  /**
   * Generates CSS styles for proper document formatting
   */
  private generateStyles(): string {
    return `
<style>
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    color: #333;
  }
  
  .meeting-title {
    color: #2c3e50;
    border-bottom: 3px solid #3498db;
    padding-bottom: 0.5rem;
    margin-bottom: 1.5rem;
  }
  
  .metadata {
    background-color: #f8f9fa;
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-style: italic;
    color: #6c757d;
  }
  
  .meeting-datetime {
    background-color: #e8f4fd;
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 2rem;
    border-left: 4px solid #007bff;
  }
  
  .datetime-item {
    margin-bottom: 0.5rem;
    color: #495057;
  }
  
  .datetime-item:last-child {
    margin-bottom: 0;
  }
  
  .toc {
    background-color: #f1f3f4;
    padding: 1.5rem;
    border-radius: 6px;
    margin-bottom: 2rem;
  }
  
  .toc h2 {
    margin-top: 0;
    color: #495057;
  }
  
  .toc ul {
    margin: 0;
    padding-left: 1.5rem;
  }
  
  .toc a {
    color: #007bff;
    text-decoration: none;
  }
  
  .topic-section {
    margin-bottom: 3rem;
  }
  
  .topic-title {
    color: #495057;
    border-left: 4px solid #007bff;
    padding-left: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .block {
    margin-bottom: 2rem;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .block-header {
    font-weight: bold;
    margin-bottom: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
    display: inline-block;
  }
  
  .block-content {
    margin-top: 1rem;
  }
  
  .block-meta {
    font-size: 0.875rem;
    color: #6c757d;
    margin-top: 1rem;
    font-style: italic;
  }
  
  /* Block type specific colors */
  .block-note { background-color: #e3f2fd; }
  .block-note .block-header { background-color: #1976d2; color: white; }
  
  .block-qanda { background-color: #f3e5f5; }
  .block-qanda .block-header { background-color: #7b1fa2; color: white; }
  
  .block-research { background-color: #e8f5e8; }
  .block-research .block-header { background-color: #388e3c; color: white; }
  
  .block-fact { background-color: #fff3e0; }
  .block-fact .block-header { background-color: #f57c00; color: white; }
  
  .block-decision { background-color: #ffebee; }
  .block-decision .block-header { background-color: #d32f2f; color: white; }
  
  .block-issue { background-color: #fce4ec; }
  .block-issue .block-header { background-color: #c2185b; color: white; }
  
  .block-todo { background-color: #f1f8e9; }
  .block-todo .block-header { background-color: #689f38; color: white; }
  
  .block-goal { background-color: #e0f2f1; }
  .block-goal .block-header { background-color: #00796b; color: white; }
  
  .block-followup { background-color: #e1f5fe; }
  .block-followup .block-header { background-color: #0288d1; color: white; }
  
  .block-idea { background-color: #f9fbe7; }
  .block-idea .block-header { background-color: #827717; color: white; }
  
  .block-reference { background-color: #fafafa; }
  .block-reference .block-header { background-color: #424242; color: white; }
  
  .todo-checkbox {
    margin-right: 0.5rem;
  }
  
  .field-label {
    font-weight: 600;
    color: #495057;
  }
  
  .no-blocks {
    color: #6c757d;
    font-style: italic;
    text-align: center;
    padding: 2rem;
  }
  
  .attendees {
    background-color: #f8f9fa;
    padding: 1.5rem;
    border-radius: 6px;
    margin-bottom: 2rem;
    border-left: 4px solid #007bff;
  }
  
  .attendees h2 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #495057;
  }
  
  .attendees ul {
    margin: 0;
    padding-left: 1.5rem;
  }
  
  .attendees li {
    margin-bottom: 0.5rem;
    color: #495057;
  }
</style>`;
  }

  /**
   * Generates metadata section HTML (created, modified, total blocks)
   */
  private generateMetadataHTML(
    meeting: Meeting,
    t?: (key: string) => string,
    language?: string,
  ): string {
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
    const metadataContent =
      `${createdLabel}: ${createdDate} | ${modifiedLabel}: ${modifiedDate} | ${blocksLabel}: ${totalBlocks}`;

    return `<div class="metadata">${metadataContent}</div>`;
  }

  /**
   * Generates meeting date and time section HTML
   */
  private generateMeetingDateTimeHTML(
    meeting: Meeting,
    t?: (key: string) => string,
    language?: string,
  ): string {
    const meetingDate = this.formatLocalizedDate(meeting.date, language);
    const startTime = meeting.startTime;
    const endTime = meeting.endTime;

    const dateLabel = t ? t("importExport.content.date") || "Date" : "Date";
    const timeLabel = t ? t("importExport.content.time") || "Time" : "Time";

    return `
<div class="meeting-datetime">
  <div class="datetime-item"><strong>${dateLabel}:</strong> ${meetingDate}</div>
  <div class="datetime-item"><strong>${timeLabel}:</strong> ${startTime} - ${endTime}</div>
</div>`;
  }

  /**
   * Generates attendees section HTML
   */
  private generateAttendeesHTML(
    meeting: Meeting,
    attendees?: Attendee[],
    t?: (key: string) => string,
    _language?: string,
  ): string | null {
    if (
      !attendees || attendees.length === 0 || !meeting.attendeeIds ||
      meeting.attendeeIds.length === 0
    ) {
      return null;
    }

    // Filter attendees to only include those assigned to this meeting
    const meetingAttendees = attendees.filter((a) =>
      meeting.attendeeIds.includes(a.id)
    );

    if (meetingAttendees.length === 0) {
      return null;
    }

    const attendeesTitle = this.getAttendeesLabelWithCount(
      meetingAttendees.length,
      t,
    );
    const attendeesList = meetingAttendees.map((attendee) => {
      const attendeeText = attendee.email
        ? `${this.escapeHtml(attendee.name)} (${
          this.escapeHtml(attendee.email)
        })`
        : this.escapeHtml(attendee.name);
      return `<li>${attendeeText}</li>`;
    });

    return `
<div class="attendees">
  <h2>${attendeesTitle}</h2>
  <ul>
    ${attendeesList.join("\n    ")}
  </ul>
</div>`;
  }

  /**
   * Generates table of contents HTML
   */
  private generateTableOfContentsHTML(
    meeting: Meeting,
    t?: (key: string) => string,
    _language?: string,
  ): string | null {
    if (!meeting.topicGroups || meeting.topicGroups.length === 0) {
      return null;
    }

    const sortedTopicGroups = [...meeting.topicGroups].sort((a, b) =>
      a.order - b.order
    );

    const tocItems = sortedTopicGroups.map((group) => {
      const anchor = this.generateAnchor(group.name);
      return `<li><a href="#${anchor}">${this.escapeHtml(group.name)}</a></li>`;
    });

    const tocTitle = t
      ? t("importExport.content.tableOfContents")
      : "Table of Contents";

    return `
<div class="toc">
  <h2>${tocTitle}</h2>
  <ul>
    ${tocItems.join("\n    ")}
  </ul>
</div>`;
  }

  /**
   * Generates content sections HTML
   */
  private generateContentSectionsHTML(
    meeting: Meeting,
    t?: (key: string) => string,
    language?: string,
  ): string {
    const sections: string[] = [];

    if (!meeting.topicGroups || meeting.topicGroups.length === 0) {
      // No topic groups - show all blocks in one section
      if (meeting.blocks.length > 0) {
        const blocksTitle = t ? t("importExport.content.blocks") : "Blocks";
        sections.push(`<div class="topic-section">`);
        sections.push(`<h2 class="topic-title">${blocksTitle}</h2>`);
        sections.push(this.generateBlocksHTML(meeting.blocks, t, language));
        sections.push(`</div>`);
      }
      return sections.join("\n");
    }

    // Sort topic groups by order
    const sortedTopicGroups = [...meeting.topicGroups].sort((a, b) =>
      a.order - b.order
    );

    // Generate sections for each topic group
    for (const topicGroup of sortedTopicGroups) {
      const anchor = this.generateAnchor(topicGroup.name);
      sections.push(`<div class="topic-section" id="${anchor}">`);
      sections.push(
        `<h2 class="topic-title">${this.escapeHtml(topicGroup.name)}</h2>`,
      );

      // Get blocks for this topic group, sorted by sortKey
      const topicBlocks = meeting.blocks
        .filter((block) => block.topicGroupId === topicGroup.id)
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

      if (topicBlocks.length > 0) {
        sections.push(this.generateBlocksHTML(topicBlocks, t, language));
      } else {
        const noBlocksText = t
          ? t("importExport.content.noBlocksInSection")
          : "No blocks in this section";
        sections.push(`<div class="no-blocks">${noBlocksText}</div>`);
      }

      sections.push(`</div>`);
    }

    return sections.join("\n");
  }

  /**
   * Generates HTML for a list of blocks
   */
  private generateBlocksHTML(
    blocks: Block[],
    t?: (key: string) => string,
    language?: string,
  ): string {
    const blockElements = blocks.map((block) =>
      this.formatBlockHTML(block, t, language)
    );
    return blockElements.join("\n");
  }

  /**
   * Formats a single block as HTML
   */
  private formatBlockHTML(
    block: Block,
    t?: (key: string) => string,
    language?: string,
  ): string {
    const label = getLocalizedBlockLabel(block.type, t, language);
    const blockClass = `block-${block.type.replace("block", "")}`;

    let contentHTML = "";

    switch (block.type) {
      case "textblock":
        contentHTML = `<div class="block-content">${
          this.escapeHtml(getBlockFieldValue(block, "text"))
        }</div>`;
        break;

      case "qandablock": {
        const question = getBlockFieldValue(block, "question");
        const answer = getBlockFieldValue(block, "answer");
        const questionLabel = getLocalizedFieldLabel("question", t);
        const answerLabel = getLocalizedFieldLabel("answer", t);
        contentHTML = `
<div class="block-content">
  <div><span class="field-label">${questionLabel}:</span> ${
          this.escapeHtml(question)
        }</div>
  <div><span class="field-label">${answerLabel}:</span> ${
          this.escapeHtml(answer)
        }</div>
</div>`;
        break;
      }

      case "researchblock": {
        const topic = getBlockFieldValue(block, "topic");
        const result = getBlockFieldValue(block, "result");
        const topicLabel = getLocalizedFieldLabel("topic", t);
        const resultLabel = getLocalizedFieldLabel("result", t);
        contentHTML = `
<div class="block-content">
  <div><span class="field-label">${topicLabel}:</span> ${
          this.escapeHtml(topic)
        }</div>
  <div><span class="field-label">${resultLabel}:</span> ${
          this.escapeHtml(result)
        }</div>
</div>`;
        break;
      }

      case "factblock":
        contentHTML = `<div class="block-content">${
          this.escapeHtml(getBlockFieldValue(block, "fact"))
        }</div>`;
        break;

      case "decisionblock":
        contentHTML = `<div class="block-content">${
          this.escapeHtml(getBlockFieldValue(block, "decision"))
        }</div>`;
        break;

      case "issueblock":
        contentHTML = `<div class="block-content">${
          this.escapeHtml(getBlockFieldValue(block, "issue"))
        }</div>`;
        break;

      case "todoblock": {
        const todoText = getBlockFieldValue(block, "todo");
        const checkboxHTML = block.completed
          ? '<span class="todo-checkbox">☑</span>'
          : '<span class="todo-checkbox">☐</span>';
        contentHTML = `<div class="block-content">${checkboxHTML}${
          this.escapeHtml(todoText)
        }</div>`;
        break;
      }

      case "goalblock":
        contentHTML = `<div class="block-content">${
          this.escapeHtml(getBlockFieldValue(block, "goal"))
        }</div>`;
        break;

      case "followupblock":
        contentHTML = `<div class="block-content">${
          this.escapeHtml(getBlockFieldValue(block, "followup"))
        }</div>`;
        break;

      case "ideablock":
        contentHTML = `<div class="block-content">${
          this.escapeHtml(getBlockFieldValue(block, "idea"))
        }</div>`;
        break;

      case "referenceblock":
        contentHTML = `<div class="block-content">${
          this.escapeHtml(getBlockFieldValue(block, "reference"))
        }</div>`;
        break;

      default:
        contentHTML = `<div class="block-content">${
          this.escapeHtml(JSON.stringify(block))
        }</div>`;
    }

    return `
<div class="block ${blockClass}">
  <div class="block-header">[${label}]</div>
  ${contentHTML}
</div>`;
  }

  /**
   * Escapes HTML special characters
   */
  private escapeHtml(text: string): string {
    if (typeof text !== "string") {
      return "";
    }

    // Fallback for environments where document is not available or mocked
    try {
      const div = document.createElement("div");
      div.textContent = text;
      const result = div.innerHTML;

      // If mocked, innerHTML might not work correctly, fall back to manual escaping
      if ((result === "" || result === undefined) && text !== "") {
        throw new Error("Mocked DOM detected");
      }

      // Convert line breaks to <br> tags after DOM escaping
      return result.replace(/\n/g, "<br>");
    } catch {
      // Manual HTML escaping as fallback for test environments
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/\n/g, "<br>");
    }
  }

  /**
   * Generates URL-safe anchor from text
   */
  private generateAnchor(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  /**
   * Formats date time with localization
   */
  private formatLocalizedDateTime(date: string, language?: string): string {
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
