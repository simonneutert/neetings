import { Block, getBlockFieldValue } from "../../../types/Block";
import {
  getLocalizedBlockLabel,
  getLocalizedFieldLabel,
} from "../../translation";

/**
 * Shared block formatting utilities for export transformers
 * Provides consistent block data extraction and common formatting patterns
 */
export class BlockFormatter {
  /**
   * Get formatted block data for any block type
   * Returns structured data that can be formatted differently by each transformer
   */
  static getBlockData(
    block: Block,
    t?: (key: string) => string,
    language?: string,
  ) {
    const label = getLocalizedBlockLabel(block.type, t, language);

    const baseData = {
      type: block.type,
      label,
    };

    switch (block.type) {
      case "textblock":
        return {
          ...baseData,
          content: {
            text: getBlockFieldValue(block, "text"),
          },
        };

      case "qandablock":
        return {
          ...baseData,
          content: {
            question: {
              label: getLocalizedFieldLabel("question", t),
              value: getBlockFieldValue(block, "question"),
            },
            answer: {
              label: getLocalizedFieldLabel("answer", t),
              value: getBlockFieldValue(block, "answer"),
            },
          },
        };

      case "researchblock":
        return {
          ...baseData,
          content: {
            topic: {
              label: getLocalizedFieldLabel("topic", t),
              value: getBlockFieldValue(block, "topic"),
            },
            result: {
              label: getLocalizedFieldLabel("result", t),
              value: getBlockFieldValue(block, "result"),
            },
          },
        };

      case "factblock":
        return {
          ...baseData,
          content: {
            fact: getBlockFieldValue(block, "fact"),
          },
        };

      case "decisionblock":
        return {
          ...baseData,
          content: {
            decision: getBlockFieldValue(block, "decision"),
          },
        };

      case "issueblock":
        return {
          ...baseData,
          content: {
            issue: getBlockFieldValue(block, "issue"),
          },
        };

      case "todoblock":
        return {
          ...baseData,
          content: {
            todo: getBlockFieldValue(block, "todo"),
            completed: block.completed,
            checkbox: block.completed ? "[X]" : "[ ]",
          },
        };

      case "goalblock":
        return {
          ...baseData,
          content: {
            goal: getBlockFieldValue(block, "goal"),
          },
        };

      case "followupblock":
        return {
          ...baseData,
          content: {
            followup: getBlockFieldValue(block, "followup"),
          },
        };

      case "ideablock":
        return {
          ...baseData,
          content: {
            idea: getBlockFieldValue(block, "idea"),
          },
        };

      case "referenceblock":
        return {
          ...baseData,
          content: {
            reference: getBlockFieldValue(block, "reference"),
          },
        };

      default:
        return {
          ...baseData,
          content: {
            raw: JSON.stringify(block),
          },
        };
    }
  }

  /**
   * Get all blocks formatted for export
   */
  static getFormattedBlocks(
    blocks: Block[],
    t?: (key: string) => string,
    language?: string,
  ) {
    return blocks.map((block) => this.getBlockData(block, t, language));
  }

  /**
   * Generate anchor/slug from text (shared between Markdown and HTML)
   */
  static generateAnchor(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }
}
