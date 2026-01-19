import { useState } from "preact/hooks";
import { APP_CONFIG } from "../constants/index";

export type FilterType =
  | "todos_completed"
  | "todos_uncompleted"
  | "facts"
  | "qandas"
  | "decisions"
  | "issues"
  | "research"
  | "stories"
  | "goals"
  | "followups"
  | "ideas"
  | "references";

interface FilterPreferences {
  selectedFilters: FilterType[];
}

const DEFAULT_FILTER_PREFERENCES: FilterPreferences = {
  selectedFilters: ["todos_uncompleted", "followups"],
};

export function useFilterPreferences() {
  const [filterPreferences, setFilterPreferences] = useState<FilterPreferences>(
    () => {
      try {
        const stored = localStorage.getItem(
          APP_CONFIG.LOCAL_STORAGE_KEYS.FILTER_PREFERENCES,
        );
        if (stored) {
          const parsed = JSON.parse(stored) as FilterPreferences;
          // Validate that stored filters are valid
          const validFilters = parsed.selectedFilters?.filter((filter) =>
            [
              "todos_completed",
              "todos_uncompleted",
              "facts",
              "qandas",
              "decisions",
              "issues",
              "research",
              "stories",
              "goals",
              "followups",
              "ideas",
              "references",
            ].includes(filter)
          ) || [];

          return {
            selectedFilters: validFilters.length > 0
              ? validFilters
              : DEFAULT_FILTER_PREFERENCES.selectedFilters,
          };
        }
      } catch (error) {
        console.warn(
          "Failed to parse filter preferences from localStorage:",
          error,
        );
      }
      return DEFAULT_FILTER_PREFERENCES;
    },
  );

  const saveFilterPreferences = (preferences: FilterPreferences) => {
    try {
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.FILTER_PREFERENCES,
        JSON.stringify(preferences),
      );
      setFilterPreferences(preferences);
    } catch (error) {
      console.error(
        "Failed to save filter preferences to localStorage:",
        error,
      );
    }
  };

  const updateSelectedFilters = (selectedFilters: FilterType[]) => {
    const newPreferences = {
      ...filterPreferences,
      selectedFilters,
    };
    saveFilterPreferences(newPreferences);
  };

  const toggleFilter = (filterType: FilterType) => {
    const currentFilters = filterPreferences.selectedFilters;
    const updatedFilters = currentFilters.includes(filterType)
      ? currentFilters.filter((f) => f !== filterType)
      : [...currentFilters, filterType];

    updateSelectedFilters(updatedFilters);
  };

  const resetToDefaults = () => {
    saveFilterPreferences(DEFAULT_FILTER_PREFERENCES);
  };

  return {
    selectedFilters: filterPreferences.selectedFilters,
    updateSelectedFilters,
    toggleFilter,
    resetToDefaults,
  };
}
