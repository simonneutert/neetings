import { Meeting } from "../../../types/Meeting";
import { Block } from "../../../types/Block";
import { TopicGroup } from "../../../types/TopicGroup";

/**
 * Shared content structure utilities for export transformers
 * Provides consistent content organization patterns across all export formats
 */
export class ContentStructure {
  /**
   * Sort topic groups by order
   */
  static sortTopicGroups(topicGroups: TopicGroup[]): TopicGroup[] {
    return [...topicGroups].sort((a, b) => a.order - b.order);
  }

  /**
   * Get blocks for a specific topic group, sorted by sortKey
   */
  static getTopicGroupBlocks(meeting: Meeting, topicGroupId: string): Block[] {
    return meeting.blocks
      .filter((block) => block.topicGroupId === topicGroupId)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }

  /**
   * Get blocks for the default "Main Agenda" group (topicGroupId: null), sorted by sortKey
   */
  static getMainAgendaBlocks(meeting: Meeting): Block[] {
    return meeting.blocks
      .filter((block) => block.topicGroupId === null)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }

  /**
   * Check if meeting has topic groups
   */
  static hasTopicGroups(meeting: Meeting): boolean {
    return meeting.topicGroups && meeting.topicGroups.length > 0;
  }

  /**
   * Generate table of contents entries from topic groups
   */
  static generateTableOfContentsEntries(
    meeting: Meeting,
    t?: (key: string) => string,
  ): Array<{ name: string; blockCount: number }> | null {
    if (!this.hasTopicGroups(meeting)) {
      return null;
    }

    const entries: Array<{ name: string; blockCount: number }> = [];

    // Add Main Agenda section first
    const mainAgendaBlocks = this.getMainAgendaBlocks(meeting);
    if (mainAgendaBlocks.length > 0) {
      entries.push({
        name: this.getMainAgendaTitle(t),
        blockCount: mainAgendaBlocks.length,
      });
    }

    // Add named topic groups
    const sortedTopicGroups = this.sortTopicGroups(meeting.topicGroups!);
    entries.push(...sortedTopicGroups.map((group) => ({
      name: group.name,
      blockCount: this.getTopicGroupBlocks(meeting, group.id).length,
    })));

    return entries;
  }

  /**
   * Get organized content sections for export
   */
  static getOrganizedContentSections(meeting: Meeting): Array<{
    topicGroup: TopicGroup | null;
    blocks: Block[];
    isEmpty: boolean;
  }> {
    if (!this.hasTopicGroups(meeting)) {
      // No topic groups - return all blocks in one section
      return [{
        topicGroup: null,
        blocks: meeting.blocks.sort((a, b) =>
          a.sortKey.localeCompare(b.sortKey)
        ),
        isEmpty: meeting.blocks.length === 0,
      }];
    }

    const sections: Array<{
      topicGroup: TopicGroup | null;
      blocks: Block[];
      isEmpty: boolean;
    }> = [];

    // Add Main Agenda section first (blocks with topicGroupId: null)
    const mainAgendaBlocks = this.getMainAgendaBlocks(meeting);
    if (mainAgendaBlocks.length > 0) {
      sections.push({
        topicGroup: null, // null indicates this is the default "Main Agenda" group
        blocks: mainAgendaBlocks,
        isEmpty: false,
      });
    }

    // Add named topic groups in order
    const sortedTopicGroups = this.sortTopicGroups(meeting.topicGroups!);
    sections.push(...sortedTopicGroups.map((topicGroup) => {
      const blocks = this.getTopicGroupBlocks(meeting, topicGroup.id);
      return {
        topicGroup,
        blocks,
        isEmpty: blocks.length === 0,
      };
    }));

    return sections;
  }

  /**
   * Get blocks label for sections without topic groups
   */
  static getBlocksLabel(t?: (key: string) => string): string {
    return t ? t("importExport.content.blocks") : "Blocks";
  }

  /**
   * Get "no blocks in section" text
   */
  static getNoBlocksText(t?: (key: string) => string): string {
    return t
      ? t("importExport.content.noBlocksInSection")
      : "No blocks in this section";
  }

  /**
   * Get table of contents title
   */
  static getTableOfContentsTitle(t?: (key: string) => string): string {
    return t ? t("importExport.content.tableOfContents") : "Table of Contents";
  }

  /**
   * Get Main Agenda title (localized)
   */
  static getMainAgendaTitle(t?: (key: string) => string): string {
    return t ? t("topics.labels.mainAgenda") : "Main Agenda";
  }
}
