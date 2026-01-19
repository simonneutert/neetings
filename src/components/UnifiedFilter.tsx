import { FunctionalComponent } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import { Block, BLOCK_TYPES, getBlockFieldValue } from "../types/Block";
import { Meeting } from "../types/Meeting";
import { BlockVisual } from "./BlockVisual";
import { useDebounceSearch } from "../hooks/useDebounceSearch";
import {
  FilterType,
  useFilterPreferences,
} from "../hooks/useFilterPreferences";
import { blockMatchesSearch, meetingMatchesSearch } from "../utils/search";
import { useTranslation } from "../i18n";
import { EnhancedFilterButton } from "./EnhancedFilterButton";
import { TEXTAREA_FIELDS } from "../constants/index";

interface UnifiedFilterProps {
  meetings: Meeting[];
  onNavigateToMeeting: (meetingId: string) => void;
  onToggleTodoCompletion?: (meetingId: string, blockId: string) => void;
  mode: "overview" | "meeting";
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  disabled?: boolean;
}

const FILTER_OPTIONS = {
  todos_completed: {
    label: "filter.filterTypes.todos_completed",
    blockType: "todoblock",
    completionFilter: "completed",
  },
  todos_uncompleted: {
    label: "filter.filterTypes.todos_uncompleted",
    blockType: "todoblock",
    completionFilter: "uncompleted",
  },
  facts: { label: "filter.filterTypes.facts", blockType: "factblock" },
  qandas: { label: "filter.filterTypes.qandas", blockType: "qandablock" },
  decisions: {
    label: "filter.filterTypes.decisions",
    blockType: "decisionblock",
  },
  issues: { label: "filter.filterTypes.issues", blockType: "issueblock" },
  research: {
    label: "filter.filterTypes.research",
    blockType: "researchblock",
  },
  stories: { label: "filter.filterTypes.stories", blockType: "textblock" },
  goals: { label: "filter.filterTypes.goals", blockType: "goalblock" },
  followups: {
    label: "filter.filterTypes.followups",
    blockType: "followupblock",
  },
  ideas: { label: "filter.filterTypes.ideas", blockType: "ideablock" },
  references: {
    label: "filter.filterTypes.references",
    blockType: "referenceblock",
  },
} as const;

export const UnifiedFilter: FunctionalComponent<UnifiedFilterProps> = ({
  meetings,
  onNavigateToMeeting,
  onToggleTodoCompletion,
  mode,
  isExpanded = true,
  onToggleExpanded,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const { selectedFilters, toggleFilter } = useFilterPreferences();
  const [hasUserChangedDateRange, setHasUserChangedDateRange] = useState(false);

  // Search functionality integration
  const {
    searchQuery,
    debouncedQuery,
    isSearching,
    setSearchQuery,
    clearSearch,
  } = useDebounceSearch();

  // Date range state (only for overview mode)
  const getDateRange = () => {
    if (!meetings.length) {
      const now = new Date();
      return {
        oldestDate: now.toISOString().slice(0, 10),
        newestDate: now.toISOString().slice(0, 10),
      };
    }

    const dates = meetings
      .map((m) => new Date(m.date))
      .filter((date) => !isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) {
      const now = new Date();
      return {
        oldestDate: now.toISOString().slice(0, 10),
        newestDate: now.toISOString().slice(0, 10),
      };
    }

    return {
      oldestDate: dates[0].toISOString().slice(0, 10),
      newestDate: dates[dates.length - 1].toISOString().slice(0, 10),
    };
  };

  const { oldestDate, newestDate } = getDateRange();

  // Default to past 10 meetings (or all if less than 10) - only for overview mode
  const getDefaultDateRange = useCallback(() => {
    if (!meetings.length) return { startDate: oldestDate, endDate: newestDate };

    const sortedMeetings = [...meetings]
      .filter((m) => m.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const recentMeetings = sortedMeetings.slice(
      0,
      Math.min(10, sortedMeetings.length),
    );

    if (recentMeetings.length === 0) {
      return { startDate: oldestDate, endDate: newestDate };
    }

    const startDate = recentMeetings[recentMeetings.length - 1].date;
    const endDate = recentMeetings[0].date;

    return { startDate, endDate };
  }, [meetings, oldestDate, newestDate]);

  const defaultRange = getDefaultDateRange();
  const [dateRange, setDateRange] = useState({
    startDate: defaultRange.startDate,
    endDate: defaultRange.endDate,
  });

  // Update date range to past 10 meetings whenever meetings change (but only if user hasn't manually changed it)
  useEffect(() => {
    if (!hasUserChangedDateRange && mode === "overview") {
      const newDefaultRange = getDefaultDateRange();
      setDateRange({
        startDate: newDefaultRange.startDate,
        endDate: newDefaultRange.endDate,
      });
    }
  }, [meetings, hasUserChangedDateRange, getDefaultDateRange, mode]);

  const handleFilterToggle = (filterType: FilterType) => {
    toggleFilter(filterType);
  };

  // Filter meetings by date range and search query (overview mode behavior)
  const filteredMeetings = meetings.filter((meeting) => {
    // For meeting mode, don't apply date filtering
    if (mode === "meeting") {
      if (debouncedQuery) {
        return meetingMatchesSearch(meeting, debouncedQuery);
      }
      return true;
    }

    // Overview mode: apply date filtering
    if (!meeting.date) return true; // Include meetings without meeting date

    const meetingDate = meeting.date;
    const dateMatches = meetingDate >= dateRange.startDate &&
      meetingDate <= dateRange.endDate;

    // If there's a search query, apply search filter
    if (debouncedQuery) {
      return dateMatches && meetingMatchesSearch(meeting, debouncedQuery);
    }

    return dateMatches;
  });

  // Helper function to determine if a block matches the filter criteria
  const blockMatchesFilter = (
    block: Block,
    filterType: FilterType,
  ): boolean => {
    const filterOption = FILTER_OPTIONS[filterType];

    if (block.type !== filterOption.blockType) {
      return false;
    }

    // For TODO blocks, check completion status
    if (
      filterOption.blockType === "todoblock" &&
      "completionFilter" in filterOption
    ) {
      const isCompleted = block.completed === true;
      return (filterOption.completionFilter === "completed" && isCompleted) ||
        (filterOption.completionFilter === "uncompleted" && !isCompleted);
    }

    return true;
  };

  // Helper function to get a default filter type for a block (used in search-only mode)
  const getBlockFilterType = (block: Block): FilterType => {
    const matchingFilter = Object.entries(FILTER_OPTIONS).find(([_, config]) =>
      block.type === config.blockType
    );
    return matchingFilter?.[0] as FilterType || "facts";
  };

  // Helper function to calculate TODO completion stats
  const getTodoStats = (meeting: Meeting) => {
    const allTodoBlocks =
      meeting.blocks?.filter((block) => block.type === "todoblock") || [];
    const completed = allTodoBlocks.filter((block) => block.completed).length;
    return { completedCount: completed, totalCount: allTodoBlocks.length };
  };

  const getFilteredMeetingsData = () => {
    const result: Array<{
      meeting: Meeting;
      blocks: Array<
        { block: Block; blockIndex: number; filterType: FilterType }
      >;
      completedCount?: number;
      totalCount?: number;
    }> = [];

    const hasSearchQuery = !!debouncedQuery;
    const hasFilters = selectedFilters.length > 0;
    const showTodoStats = selectedFilters.some((filter) =>
      filter === "todos_completed" || filter === "todos_uncompleted"
    );

    filteredMeetings.forEach((meeting) => {
      const filteredBlocks: Array<
        { block: Block; blockIndex: number; filterType: FilterType }
      > = [];

      meeting.blocks?.forEach((block: Block, index: number) => {
        let shouldIncludeBlock = false;
        let matchingFilterType: FilterType | null = null;

        if (hasSearchQuery && !hasFilters) {
          // Search-only mode: show only blocks that match the search query
          if (blockMatchesSearch(block, debouncedQuery)) {
            shouldIncludeBlock = true;
            matchingFilterType = getBlockFilterType(block);
          }
        } else if (hasFilters) {
          // Filter mode (with or without search): check if block matches any selected filter
          for (const filterType of selectedFilters) {
            if (blockMatchesFilter(block, filterType)) {
              // If we have search query, only include blocks that match search OR if meeting title matches
              if (hasSearchQuery) {
                // Show the block if either:
                // 1. The block itself matches the search query, OR
                // 2. The meeting title matches the search query (regardless of block content)
                const blockMatchesSearchQuery = blockMatchesSearch(
                  block,
                  debouncedQuery,
                );
                const meetingTitleMatches = meeting.title &&
                  meeting.title.toLowerCase().includes(
                    debouncedQuery.toLowerCase(),
                  );

                if (blockMatchesSearchQuery || meetingTitleMatches) {
                  shouldIncludeBlock = true;
                  matchingFilterType = filterType;
                  break; // Exit loop once we find a match to avoid duplicates
                }
              } else {
                // No search query, just filter matching
                shouldIncludeBlock = true;
                matchingFilterType = filterType;
                break; // Exit loop once we find a match to avoid duplicates
              }
            }
          }
        }

        // Add block only once, preserving original order
        if (shouldIncludeBlock && matchingFilterType) {
          filteredBlocks.push({
            block,
            blockIndex: index,
            filterType: matchingFilterType,
          });
        }
      });

      if (filteredBlocks.length > 0) {
        // Sort blocks by their sortKey to match kanban board order
        // Fallback to block index if sortKey is missing (for test compatibility)
        const sortedFilteredBlocks = filteredBlocks.sort((a, b) => {
          const sortKeyA = a.block.sortKey ||
            `${a.blockIndex}`.padStart(10, "0");
          const sortKeyB = b.block.sortKey ||
            `${b.blockIndex}`.padStart(10, "0");
          return sortKeyA.localeCompare(sortKeyB);
        });

        const meetingData: any = { meeting, blocks: sortedFilteredBlocks };

        if (showTodoStats) {
          const { completedCount, totalCount } = getTodoStats(meeting);
          meetingData.completedCount = completedCount;
          meetingData.totalCount = totalCount;
        }

        result.push(meetingData);
      }
    });

    return result;
  };

  const renderBlockContent = (block: Block) => {
    const blockType = BLOCK_TYPES[block.type];

    return (
      <div className="mb-2">
        {blockType.fields.map((field) => {
          const value = getBlockFieldValue(block, field);
          if (!value.trim()) return null;

          const isTextArea = TEXTAREA_FIELDS.includes(
            field as (typeof TEXTAREA_FIELDS)[number],
          );

          return (
            <div key={field} className="mb-1">
              {blockType.fields.length > 1 && (
                <strong className="text-capitalize">{field}:</strong>
              )}
              <span
                style={{
                  textDecoration: block.type === "todoblock" && block.completed
                    ? "line-through"
                    : "none",
                  opacity: block.type === "todoblock" && block.completed
                    ? 0.7
                    : 1,
                  whiteSpace: isTextArea ? "pre-line" : "normal",
                }}
              >
                {value}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const filteredData = getFilteredMeetingsData();

  // Render search input with clear button and status indicators
  const renderSearchSection = () => (
    <div className={mode === "overview" ? "" : "mb-3"}>
      <div className="d-flex align-items-center gap-2">
        <input
          type="text"
          className="form-control form-control-lg"
          placeholder={t("filter.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery((e.target as HTMLInputElement).value);
          }}
          style={{
            fontSize: "0.9rem",
            transition: "all 0.15s ease",
          }}
        />
        {searchQuery && (
          <button
            className="btn btn-outline-secondary"
            onClick={clearSearch}
            title={t("filter.clearSearch")}
            style={{
              fontSize: "0.8rem",
              transition: "all 0.15s ease",
            }}
          >
            ✕
          </button>
        )}
      </div>
      {/* Search status indicators */}
      {isSearching && (
        <div className="small text-muted mt-1">
          {t("common.searching")}
        </div>
      )}
      {debouncedQuery && !isSearching && (
        <div className="small text-muted mt-1">
          {t("filter.searchingFor").replace("{{query}}", debouncedQuery)}
        </div>
      )}
    </div>
  );

  // Generate appropriate empty state message
  const getEmptyStateMessage = () => {
    if (debouncedQuery) {
      return t("filter.noResultsFor").replace("{{query}}", debouncedQuery);
    }
    if (selectedFilters.length === 0) {
      return t("filter.noFiltersMessage");
    }
    const filterLabels = selectedFilters.map((f) =>
      t(FILTER_OPTIONS[f].label).toLowerCase()
    ).join(", ");
    return t("filter.noContentFound").replace("{{filters}}", filterLabels);
  };

  // Render filter checkboxes section
  const renderFilterCheckboxes = () => (
    <div className="bg-body-secondary rounded p-3 mb-3">
      <h6 className="mb-3 text-body-emphasis">Content Types</h6>
      <div className={mode === "overview" ? "row g-2" : "row g-2"}>
        {Object.entries(FILTER_OPTIONS).map(([key, config]) => {
          const isChecked = selectedFilters.includes(key as FilterType);
          return (
            <div
              key={key}
              className={mode === "overview"
                ? "col-lg-3 col-md-4 col-sm-6"
                : "col-lg-3 col-md-4 col-sm-6"}
            >
              <div className="form-check">
                <input
                  id={`filter-${key}`}
                  className="form-check-input"
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleFilterToggle(key as FilterType);
                  }}
                />
                <label
                  className="form-check-label"
                  htmlFor={`filter-${key}`}
                  style={{ fontSize: "0.9rem" }}
                >
                  {t(config.label)}
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 small text-muted">
        {selectedFilters.length > 0
          ? t("filter.showing").replace(
            "{{filters}}",
            selectedFilters.map((f) => t(FILTER_OPTIONS[f].label)).join(", "),
          )
          : t("filter.showing").replace(
            "{{filters}}",
            t("filter.noFiltersSelected"),
          )}
      </div>
    </div>
  );

  // Render date range section (only for overview mode)
  const renderDateRangeSection = () => {
    if (mode !== "overview") return null;

    return (
      <div className="bg-body-secondary rounded p-3">
        <h6 className="mb-2 fw-bold" style={{ fontSize: "0.9rem" }}>
          {t("filter.dateRangeTitle")}
        </h6>
        <div className="row g-3">
          <div className="col-6">
            <label className="form-label fw-medium small">
              {t("filter.dateFrom")}
            </label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={dateRange.startDate}
              min={oldestDate}
              max={newestDate}
              onChange={(e) => {
                setDateRange((prev) => ({
                  ...prev,
                  startDate: (e.target as HTMLInputElement).value,
                }));
                setHasUserChangedDateRange(true);
              }}
            />
          </div>
          <div className="col-6">
            <label className="form-label fw-medium small">
              {t("filter.dateTo")}
            </label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={dateRange.endDate}
              min={oldestDate}
              max={newestDate}
              onChange={(e) => {
                setDateRange((prev) => ({
                  ...prev,
                  endDate: (e.target as HTMLInputElement).value,
                }));
                setHasUserChangedDateRange(true);
              }}
            />
          </div>
        </div>
        <div className="d-flex gap-2 mt-3">
          <button
            className="btn btn-outline-secondary btn-sm flex-fill"
            onClick={() => {
              setDateRange({
                startDate: oldestDate,
                endDate: newestDate,
              });
              setHasUserChangedDateRange(false);
            }}
            style={{ transition: "all 0.15s ease" }}
          >
            {t("filter.showAllDates")}
          </button>
          <button
            className="btn btn-primary btn-sm flex-fill"
            onClick={() => {
              setDateRange(getDefaultDateRange());
              setHasUserChangedDateRange(false);
            }}
            style={{ transition: "all 0.15s ease" }}
          >
            {t("filter.pastTen")}
          </button>
        </div>
        <div className="small text-muted mt-1">
          {t("filter.meetingsInRange")
            .replace("{{count}}", filteredMeetings.length.toString())
            .replace("{{plural}}", filteredMeetings.length !== 1 ? "s" : "")}
        </div>
      </div>
    );
  };

  // Render the filter content
  const renderFilterContent = () => (
    <div
      className="bg-body border rounded shadow-sm p-3 mb-3"
      style={{
        transition: "all 0.2s ease",
        borderColor: "var(--bs-border-color-translucent)",
      }}
    >
      {/* Header */}
      <div className="mb-4">
        <h5 className="mb-3 text-body-emphasis">
          {t("filter.filtersTitle")}
        </h5>

        {/* Search Section */}
        <div className="bg-body-secondary rounded p-3 mb-3">
          {renderSearchSection()}
        </div>

        {/* Filter Checkboxes */}
        {renderFilterCheckboxes()}

        {/* Date Range Section (only for overview mode) */}
        {renderDateRangeSection()}
      </div>

      {/* Content */}
      <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
        {filteredData.length === 0
          ? (
            <p className="text-muted fst-italic">
              {getEmptyStateMessage()}
            </p>
          )
          : (
            filteredData.map((
              { meeting, blocks, completedCount, totalCount },
            ) => (
              <div key={meeting.id} className="mb-4">
                {/* Meeting Header */}
                <div
                  onClick={() => onNavigateToMeeting(meeting.id)}
                  className="bg-body-tertiary border rounded p-3 mb-2 meeting-card"
                  style={{
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    borderColor: "var(--bs-border-color-translucent)",
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.transform = "translateY(-1px)";
                    target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.transform = "translateY(0)";
                    target.style.boxShadow = "none";
                  }}
                >
                  <strong>{meeting.title || t("meeting.untitled")}</strong>
                  <br />
                  <small className="text-muted">
                    {meeting.date ? `${meeting.date}` : t("filter.noDate")}
                    {selectedFilters.some((filter) =>
                      filter === "todos_completed" ||
                      filter === "todos_uncompleted"
                    ) && totalCount !== undefined && (
                      <span>
                        • {t("filter.todoStats")
                          .replace(
                            "{{completed}}",
                            completedCount?.toString() || "0",
                          )
                          .replace("{{total}}", totalCount.toString())}
                      </span>
                    )}
                  </small>
                </div>

                {/* Blocks */}
                {blocks.map(({ block, blockIndex, filterType }) => (
                  <BlockVisual
                    key={`${block.id || blockIndex}-${filterType}`}
                    block={block}
                    showTodoToggle={!!onToggleTodoCompletion}
                    onTodoToggle={() =>
                      onToggleTodoCompletion?.(meeting.id, block.id!)}
                  >
                    {renderBlockContent(block)}
                  </BlockVisual>
                ))}
              </div>
            ))
          )}
      </div>
    </div>
  );

  // Overview mode: render with toggle button and expandable content
  if (mode === "overview") {
    return (
      <div style={{ marginBottom: "2rem" }}>
        {/* Toggle Button */}
        <EnhancedFilterButton
          isExpanded={isExpanded}
          onToggle={onToggleExpanded || (() => {})}
          disabled={disabled}
        />

        {/* Filter Panel */}
        {isExpanded && renderFilterContent()}
      </div>
    );
  }

  // Meeting mode: render content directly (always visible)
  return renderFilterContent();
};
