import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/preact";
import { useFilterPreferences } from "../hooks/useFilterPreferences";
import { APP_CONFIG } from "../constants/index";

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

describe("useFilterPreferences", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe("Initial State", () => {
    it("should use default filters when no localStorage data exists", () => {
      const { result } = renderHook(() => useFilterPreferences());

      expect(result.current.selectedFilters).toEqual([
        "todos_uncompleted",
        "followups",
      ]);
    });

    it("should load filters from localStorage when available", () => {
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.FILTER_PREFERENCES,
        JSON.stringify({ selectedFilters: ["facts", "qandas"] }),
      );

      const { result } = renderHook(() => useFilterPreferences());

      expect(result.current.selectedFilters).toEqual(["facts", "qandas"]);
    });

    it("should fallback to defaults when localStorage contains invalid data", () => {
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.FILTER_PREFERENCES,
        "invalid json",
      );

      const { result } = renderHook(() => useFilterPreferences());

      expect(result.current.selectedFilters).toEqual([
        "todos_uncompleted",
        "followups",
      ]);
    });

    it("should filter out invalid filter types from localStorage", () => {
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.FILTER_PREFERENCES,
        JSON.stringify({
          selectedFilters: [
            "facts",
            "invalid_filter",
            "qandas",
            "another_invalid",
          ],
        }),
      );

      const { result } = renderHook(() => useFilterPreferences());

      expect(result.current.selectedFilters).toEqual(["facts", "qandas"]);
    });
  });

  describe("Filter Management", () => {
    it("should toggle filters correctly", () => {
      const { result } = renderHook(() => useFilterPreferences());

      // Initially has defaults
      expect(result.current.selectedFilters).toEqual([
        "todos_uncompleted",
        "followups",
      ]);

      // Toggle off a default filter
      act(() => {
        result.current.toggleFilter("todos_uncompleted");
      });

      expect(result.current.selectedFilters).toEqual(["followups"]);

      // Toggle on a new filter
      act(() => {
        result.current.toggleFilter("facts");
      });

      expect(result.current.selectedFilters).toEqual(["followups", "facts"]);

      // Toggle back on the previously removed filter
      act(() => {
        result.current.toggleFilter("todos_uncompleted");
      });

      expect(result.current.selectedFilters).toEqual([
        "followups",
        "facts",
        "todos_uncompleted",
      ]);
    });

    it("should update selected filters directly", () => {
      const { result } = renderHook(() => useFilterPreferences());

      act(() => {
        result.current.updateSelectedFilters(["decisions", "issues"]);
      });

      expect(result.current.selectedFilters).toEqual(["decisions", "issues"]);
    });

    it("should reset to defaults", () => {
      const { result } = renderHook(() => useFilterPreferences());

      // Change filters
      act(() => {
        result.current.updateSelectedFilters(["decisions", "issues"]);
      });

      expect(result.current.selectedFilters).toEqual(["decisions", "issues"]);

      // Reset to defaults
      act(() => {
        result.current.resetToDefaults();
      });

      expect(result.current.selectedFilters).toEqual([
        "todos_uncompleted",
        "followups",
      ]);
    });
  });

  describe("LocalStorage Persistence", () => {
    it("should save changes to localStorage", () => {
      const { result } = renderHook(() => useFilterPreferences());

      act(() => {
        result.current.updateSelectedFilters(["facts", "decisions"]);
      });

      const stored = localStorage.getItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.FILTER_PREFERENCES,
      );
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.selectedFilters).toEqual(["facts", "decisions"]);
    });

    it("should persist changes across hook instances", () => {
      // First hook instance
      const { result: result1 } = renderHook(() => useFilterPreferences());

      act(() => {
        result1.current.updateSelectedFilters(["research", "goals"]);
      });

      // Second hook instance (simulating page reload)
      const { result: result2 } = renderHook(() => useFilterPreferences());

      expect(result2.current.selectedFilters).toEqual(["research", "goals"]);
    });

    it("should handle localStorage errors gracefully", () => {
      // Mock localStorage to throw an error on setItem
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error("Storage quota exceeded");
      };

      const { result } = renderHook(() => useFilterPreferences());

      // Should not throw an error
      expect(() => {
        act(() => {
          result.current.updateSelectedFilters(["facts"]);
        });
      }).not.toThrow();

      // Restore original localStorage
      localStorage.setItem = originalSetItem;
    });
  });
});
