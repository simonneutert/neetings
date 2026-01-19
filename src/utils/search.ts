/**
 * Utility functions for search functionality
 */

// Normalize text for case-insensitive search
export function normalizeSearchText(text: string): string {
  return text.toLowerCase().trim();
}

// Check if text matches search query (case-insensitive)
export function matchesSearchQuery(text: string, query: string): boolean {
  if (!query) return true;
  return normalizeSearchText(text).includes(normalizeSearchText(query));
}

// Highlight search matches in text
export function highlightSearchMatches(text: string, query: string): string {
  if (!query || !text) return text;

  const normalizedQuery = normalizeSearchText(query);
  const normalizedText = normalizeSearchText(text);

  if (!normalizedText.includes(normalizedQuery)) {
    return text;
  }

  // Find all matches case-insensitively but preserve original case
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  return text.replace(
    regex,
    '<mark style="background-color: #ffeb3b; padding: 0 2px; border-radius: 2px;">$1</mark>',
  );
}

// Check if a block matches the search query in any of its fields
export function blockMatchesSearch(block: any, query: string): boolean {
  if (!query) return true;

  // Get all field values from the block
  const searchableFields = Object.keys(block).filter((key) =>
    typeof block[key] === "string" &&
    key !== "id" &&
    key !== "type" &&
    key !== "created_at" &&
    key !== "updated_at"
  );

  // Search in all text fields
  for (const field of searchableFields) {
    const value = block[field];
    if (
      value && typeof value === "string" &&
      matchesSearchQuery(value, query)
    ) {
      return true;
    }
  }

  return false;
}

// Check if a meeting matches the search query (title, blocks, etc.)
export function meetingMatchesSearch(meeting: any, query: string): boolean {
  if (!query) return true;

  // Search in meeting title
  if (meeting.title && matchesSearchQuery(meeting.title, query)) {
    return true;
  }

  // Search in blocks
  if (meeting.blocks && Array.isArray(meeting.blocks)) {
    return meeting.blocks.some((block: any) =>
      blockMatchesSearch(block, query)
    );
  }

  return false;
}
