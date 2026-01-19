// Common style utilities for consistent UI patterns
import { CSSProperties } from "preact/compat";

// Utility functions for dynamic styles
export function createTodoStyle(completed: boolean): CSSProperties {
  return completed
    ? { textDecoration: "line-through", opacity: 0.7 }
    : { textDecoration: "none", opacity: 1 };
}
