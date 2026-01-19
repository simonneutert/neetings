// Color utility for semantic block grouping
export const SEMANTIC_BLOCK_COLORS = {
  // Action Group - Orange Shades
  "action-dark": "#cc5500", // TODO - Dark orange for current tasks
  "action-medium": "#fd7e14", // Goal - Medium orange for strategic objectives
  "action-light": "#ffad66", // Follow-up - Light orange for future actions

  // Ideation Group - Yellow Shades
  "idea-dark": "#ffb000", // Idea - Deep yellow for creative thinking
  "idea-medium": "#ffc107", // Fact - Medium yellow for foundations
  "idea-light": "#fff3cd", // Research - Light yellow for insights

  // Documentation Group - Blue Shades
  "doc-dark": "#0d47a1", // Note - Deep blue for main context
  "doc-medium": "#0dcaf0", // Q&A - Medium blue for discussions
  "doc-light": "#b3e5fc", // Reference - Light blue for external sources

  // Decision Group - Critical Colors
  "decision-success": "#146c43", // Decision - Dark green for final choices
  "decision-danger": "#dc3545", // Issue - Red for problems
} as const;

// Legacy Bootstrap colors (kept for backward compatibility)
export const BOOTSTRAP_COLORS = {
  primary: "#007bff",
  secondary: "#6c757d",
  success: "#28a745",
  danger: "#dc3545",
  warning: "#ffc107",
  info: "#17a2b8",
  dark: "#343a40",
} as const;

export type SemanticColor = keyof typeof SEMANTIC_BLOCK_COLORS;
export type BootstrapColor = keyof typeof BOOTSTRAP_COLORS;

export function getSemanticColorHex(color: SemanticColor): string {
  return SEMANTIC_BLOCK_COLORS[color];
}

export function getBootstrapColorHex(color: BootstrapColor): string {
  return BOOTSTRAP_COLORS[color];
}

export function getBootstrapColorWithFallback(color: string): string {
  return BOOTSTRAP_COLORS[color as BootstrapColor] || "#6c757d";
}

// Topic Group Color Palette
export const TOPIC_GROUP_COLORS = [
  { name: "Blue", hex: "#007bff", light: "#cce7ff" },
  { name: "Green", hex: "#28a745", light: "#d4edda" },
  { name: "Orange", hex: "#fd7e14", light: "#ffe5d0" },
  { name: "Purple", hex: "#6f42c1", light: "#e2d9f3" },
  { name: "Red", hex: "#dc3545", light: "#f8d7da" },
  { name: "Teal", hex: "#20c997", light: "#d1ecf1" },
  { name: "Yellow", hex: "#ffc107", light: "#fff3cd" },
  { name: "Pink", hex: "#e83e8c", light: "#f7d6e6" },
  { name: "Cyan", hex: "#17a2b8", light: "#d1ecf1" },
  { name: "Gray", hex: "#6c757d", light: "#e9ecef" },
] as const;

export type TopicGroupColor = typeof TOPIC_GROUP_COLORS[number];

export function getTopicGroupColorByHex(
  hex: string,
): TopicGroupColor | undefined {
  return TOPIC_GROUP_COLORS.find((color) => color.hex === hex);
}

export function getTopicGroupLightBackground(hex: string): string {
  const color = getTopicGroupColorByHex(hex);
  return color ? color.light : "#e9ecef";
}
