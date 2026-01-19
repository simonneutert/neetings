/**
 * Utility functions for translation handling
 * Follows existing codebase patterns and leverages the getTranslation() system
 */

import { BLOCK_TYPES } from "../types/Block";

// Get localized text with fallback logic
export function getLocalizedText(
  key: string,
  t?: (key: string) => string,
  fallback: string = "",
  transform: "uppercase" | "capitalize" | "none" = "none",
): string {
  if (t) {
    const translated = t(key);

    // Check if translation actually worked (didn't return the key back)
    if (translated && translated !== key) {
      switch (transform) {
        case "uppercase":
          return translated.toUpperCase();
        case "capitalize":
          return translated.charAt(0).toUpperCase() + translated.slice(1);
        default:
          return translated;
      }
    }
  }

  return fallback;
}

// Get localized block type label using existing BLOCK_TYPES as fallback
export function getLocalizedBlockLabel(
  blockType: string,
  t?: (key: string) => string,
  language?: string,
): string {
  if (t && language) {
    const translationKey = `blocks.types.${blockType}`;
    const translated = t(translationKey);

    // Check if translation actually worked (didn't return the key back)
    if (translated && translated !== translationKey) {
      return translated.toUpperCase();
    }
  }

  // Fallback to existing BLOCK_TYPES system (no hardcoded strings)
  return BLOCK_TYPES[blockType]?.label?.toUpperCase() ||
    blockType.toUpperCase();
}

// Get localized field label with intelligent fallbacks
export function getLocalizedFieldLabel(
  fieldName: string,
  t?: (key: string) => string,
): string {
  if (t) {
    const translationKey = `blocks.fields.${fieldName}`;
    const translated = t(translationKey);

    // Check if translation actually worked (didn't return the key back)
    if (translated && translated !== translationKey) {
      return translated.charAt(0).toUpperCase() + translated.slice(1);
    }
  }

  // Fallback to standard field labels
  const defaultLabels: Record<string, string> = {
    question: "Q",
    answer: "A",
    topic: "Topic",
    result: "Result",
  };

  return defaultLabels[fieldName] ||
    fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
}
