/**
 * Lexicographic sort key utilities for robust block ordering
 *
 * This system uses fractional string keys (e.g., "a", "ab", "ac") to avoid
 * position conflicts and enable efficient insertion between any two blocks.
 */

const BASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
const MID_CHAR = "m"; // Middle character for initial splits

/**
 * Generates a sort key between two existing keys using lexicographic ordering.
 *
 * This is the main function new developers should use for positioning blocks.
 * It creates sortKeys that maintain alphabetical order: "a" < "ab" < "b" < "c"
 *
 * @param before - The sortKey of the block that should come before the new block (optional)
 * @param after - The sortKey of the block that should come after the new block (optional)
 * @returns A new sortKey that will sort between the before and after keys
 *
 * @example
 * // Insert at the beginning (no before key)
 * generateSortKey(undefined, "b") // Returns something like "a"
 *
 * // Insert at the end (no after key)
 * generateSortKey("b", undefined) // Returns something like "c"
 *
 * // Insert between two blocks
 * generateSortKey("a", "c") // Returns "b"
 * generateSortKey("a", "ab") // Returns something like "aa"
 */
export function generateSortKey(before?: string, after?: string): string {
  if (!before && !after) {
    return MID_CHAR; // First item
  }

  if (!before) {
    return generateKeyBefore(after);
  }

  if (!after) {
    return generateKeyAfter(before);
  }

  return generateKeyBetween(before, after);
}

/**
 * Generates a key that comes before the given key
 */
function generateKeyBefore(key: string): string {
  if (key === "a") {
    return "Z"; // Use uppercase to sort before lowercase
  }

  // Find the first character we can decrement
  for (let i = 0; i < key.length; i++) {
    const char = key[i];
    const charIndex = BASE_CHARS.indexOf(char);

    if (charIndex > 0) {
      // We can decrement this character
      return key.substring(0, i) + BASE_CHARS[charIndex - 1];
    }
  }

  // All characters are 'a', so prepend 'Z'
  return `Z${key}`;
}

/**
 * Generates a key that comes after the given key
 */
function generateKeyAfter(key: string): string {
  // Try to increment the last character
  const lastChar = key[key.length - 1];
  const lastCharIndex = BASE_CHARS.indexOf(lastChar);

  if (lastCharIndex < BASE_CHARS.length - 1) {
    // We can increment the last character
    return key.substring(0, key.length - 1) + BASE_CHARS[lastCharIndex + 1];
  }

  // Last character is 'z', so append 'a'
  return `${key}a`;
}

/**
 * Generates a key between two existing keys
 */
function generateKeyBetween(before: string, after: string): string {
  // Ensure before < after
  if (before >= after) {
    throw new Error(`Invalid key order: "${before}" should be < "${after}"`);
  }

  // Find the first position where the strings differ
  let i = 0;
  while (i < before.length && i < after.length && before[i] === after[i]) {
    i++;
  }

  // If one string is a prefix of the other
  if (i === before.length) {
    // before is a prefix of after
    if (i === after.length) {
      // They're identical (shouldn't happen due to check above)
      throw new Error(`Keys are identical: "${before}" === "${after}"`);
    }

    const nextChar = after[i];
    const nextCharIndex = BASE_CHARS.indexOf(nextChar);

    if (nextCharIndex > 0) {
      // We can insert a character between
      return before + BASE_CHARS[Math.floor(nextCharIndex / 2)];
    }
    // Next char is 'a', so we need to append to before
    return `${before}Z`;
  }

  if (i === after.length) {
    // after is a prefix of before (shouldn't happen due to order check)
    throw new Error(`Invalid key order: "${before}" should be < "${after}"`);
  }

  // Strings differ at position i
  const beforeChar = before[i];
  const afterChar = after[i];
  const beforeIndex = BASE_CHARS.indexOf(beforeChar);
  const afterIndex = BASE_CHARS.indexOf(afterChar);

  if (afterIndex - beforeIndex > 1) {
    // We can insert a character between them
    const midIndex = beforeIndex + Math.floor((afterIndex - beforeIndex) / 2);
    return before.substring(0, i) + BASE_CHARS[midIndex];
  }

  // Characters are adjacent, need to go deeper
  const common = before.substring(0, i);
  const beforeRest = before.substring(i);
  const afterRest = after.substring(i);

  // Try to find space after the common prefix
  if (beforeRest.length === 1 && afterRest.length === 1) {
    // Both are single characters, append a middle character
    return common + beforeChar + MID_CHAR;
  }

  // Characters are adjacent, need to extend the shorter string
  // For "nm" vs "o", we want to generate something like "no" or "nz"
  if (beforeRest.length > afterRest.length) {
    // Before string is longer, generate something between common + beforeChar and afterChar
    return `${common + beforeChar}z`;
  }
  // After string is longer or equal, generate after beforeChar
  return `${common + beforeChar}z`;
}

/**
 * Validates that a sort key is properly formatted
 */
export function isValidSortKey(key: string): boolean {
  if (!key || typeof key !== "string") {
    return false;
  }

  // Check that all characters are valid
  return /^[A-Za-z]+$/.test(key);
}

/**
 * Migrates a numeric position to a sort key
 */
export function positionToSortKey(
  position: number,
  totalItems: number = 1000,
): string {
  // Convert position to a fractional value between 0 and 1
  const fraction = Math.max(0, Math.min(1, position / (totalItems * 1000)));

  // Convert fraction to a sort key
  let result = "";
  let remaining = fraction;

  for (let i = 0; i < 4; i++) { // Generate up to 4 characters
    remaining *= BASE_CHARS.length;
    const index = Math.floor(remaining);
    result += BASE_CHARS[Math.min(index, BASE_CHARS.length - 1)];
    remaining -= index;

    if (remaining < 0.001) break; // Sufficient precision
  }

  return result || "a";
}

/**
 * Sorts an array of items by their sort keys in lexicographic order.
 *
 * IMPORTANT: Always call this function before displaying blocks to users!
 * The sortKey system only works if you sort the blocks before rendering them.
 *
 * @param items - Array of items that have a sortKey property
 * @returns New array sorted by sortKey (original array is not modified)
 *
 * @example
 * // Sort blocks before displaying
 * const sortedBlocks = sortBySortKey(blocks);
 *
 * // Get blocks for a topic group and sort them
 * const topicBlocks = blocks
 *   .filter(block => block.topicGroupId === groupId)
 *   .sort(sortBySortKey);
 */
export function sortBySortKey<T extends { sortKey: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

/**
 * Generates sort keys for a batch of items
 */
export function generateBatchSortKeys(count: number): string[] {
  const keys: string[] = [];

  if (count === 0) return keys;
  if (count === 1) return [MID_CHAR];

  // Generate evenly spaced keys
  for (let i = 0; i < count; i++) {
    const fraction = i / (count - 1);
    const key = positionToSortKey(fraction * 1000, 1);
    keys.push(key);
  }

  return keys;
}
