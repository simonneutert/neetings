import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/preact";
import { h } from "preact";
import { useState } from "preact/hooks";
import { renderWithI18n } from "./testUtils";
import { UnifiedFilter } from "../components/UnifiedFilter";
import { Meeting } from "../types/Meeting";

// Test wrapper component that manages filter state
const TestFilterWrapper = ({ initialExpanded = false, ...props }) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  return h(UnifiedFilter, {
    ...props,
    isExpanded,
    onToggleExpanded: () => setIsExpanded(!isExpanded),
  });
};

// Mock the debounce delay for faster testing
vi.mock("../constants", () => ({
  SEARCH_DEBOUNCE_DELAY: 50, // Reduced from 300ms for testing
  MIN_SEARCH_CHARACTERS: 3,
  APP_CONFIG: {
    AUTO_SAVE_DELAY: 500,
    FOCUS_CLEAR_DELAY: 50,
    SCROLL_DELAY: 100,
    LOCAL_STORAGE_KEYS: {
      MEETINGS: "meetings",
      LAST_VIEW: "lastView",
    },
    DEFAULT_VALUES: {
      MEETING_TITLE: "Untitled Meeting",
      OVERVIEW_VIEW: "overview",
    },
    UI: {
      MAX_INPUT_WIDTH: {
        TITLE: 300,
        TIME: 120,
        DATE: 160,
      },
      TEXTAREA_ROWS: 3,
    },
  },
  FILTER_CONFIG: {
    FILTERS_TITLE: "🔍 View Filters",
    FILTERS_HIDE: "🔍 Hide Filters",
    NO_FILTERS_MESSAGE: "Please select at least one filter to view content.",
  },
  TEXTAREA_FIELDS: [
    "text",
    "answer",
    "result",
    "goal",
    "followup",
    "idea",
    "reference",
  ],
  CONFIRM_MESSAGES: {
    DELETE_BLOCK: "Are you sure you want to delete this block?",
    CLEAR_MEETING:
      "Are you sure you want to clear this meeting? This will delete all notes and metadata for this meeting.",
    CLEAR_ALL_DATA:
      "Are you sure you want to clear all data? This will delete all meetings and cannot be undone.",
  },
}));

describe("Search Functionality", () => {
  const mockMeetings: Meeting[] = [
    {
      id: "meeting-1",
      title: "Sprint Planning Meeting",
      date: "2024-01-15",
      blocks: [
        {
          id: "block-1",
          type: "textblock",
          text:
            "We need to implement the search feature for better user experience",
        },
        {
          id: "block-2",
          type: "todoblock",
          todo: "Setup search infrastructure",
          completed: false,
        },
        {
          id: "block-3",
          type: "factblock",
          fact:
            "Search should work with 300ms debouncing to avoid excessive API calls",
        },
      ],
    },
    {
      id: "meeting-2",
      title: "Code Review Session",
      date: "2024-01-20",
      blocks: [
        {
          id: "block-4",
          type: "issueblock",
          issue: "Users cannot login when special characters are in password",
        },
        {
          id: "block-5",
          type: "decisionblock",
          decision:
            "We decided to migrate to PostgreSQL for better performance",
        },
      ],
    },
  ];

  const mockNavigate = vi.fn();
  const mockToggleTodo = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays search input in filter dashboard", async () => {
    renderWithI18n(
      <TestFilterWrapper
        mode="overview"
        meetings={mockMeetings}
        onNavigateToMeeting={mockNavigate}
        onToggleTodoCompletion={mockToggleTodo}
        disabled={false}
        initialExpanded={false}
      />,
    );

    // Expand the filter dashboard
    const toggleButton = screen.getByTitle("View Filters");
    fireEvent.click(toggleButton);

    // Check that search input is present
    const searchInput = screen.getByPlaceholderText(
      /Search across all content/,
    );
    expect(searchInput).toBeTruthy();
  });

  it("shows search query indicator when searching", async () => {
    renderWithI18n(
      <TestFilterWrapper
        mode="overview"
        meetings={mockMeetings}
        onNavigateToMeeting={mockNavigate}
        onToggleTodoCompletion={mockToggleTodo}
        initialExpanded={false}
        disabled={false}
      />,
    );

    // Expand the filter dashboard
    const toggleButton = screen.getByTitle("View Filters");
    fireEvent.click(toggleButton);

    // Type in search
    const searchInput = screen.getByPlaceholderText(
      /Search across all content/,
    );
    fireEvent.change(searchInput, { target: { value: "search feature" } });
    fireEvent.input(searchInput, { target: { value: "search feature" } });

    // Wait for debounce and check for search indicator
    await waitFor(() => {
      expect(screen.getByText(/Searching for: "search feature"/))
        .toBeTruthy();
    }, { timeout: 200 });
  });

  it("displays clear search button when there is search text", async () => {
    renderWithI18n(
      <TestFilterWrapper
        mode="overview"
        meetings={mockMeetings}
        onNavigateToMeeting={mockNavigate}
        onToggleTodoCompletion={mockToggleTodo}
        initialExpanded={false}
        disabled={false}
      />,
    );

    // Expand the filter dashboard
    const toggleButton = screen.getByTitle("View Filters");
    fireEvent.click(toggleButton);

    // Type in search
    const searchInput = screen.getByPlaceholderText(
      /Search across all content/,
    ) as HTMLInputElement;

    // Use both change and input events to ensure compatibility
    fireEvent.change(searchInput, { target: { value: "test" } });
    fireEvent.input(searchInput, { target: { value: "test" } });

    // Wait for the state to update
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Check for clear button
    const clearButton = screen.getByTitle("Clear search");
    expect(clearButton).toBeTruthy();
    expect(clearButton.textContent).toBe("✕");
  });

  it("clears search when clear button is clicked", async () => {
    renderWithI18n(
      <TestFilterWrapper
        mode="overview"
        meetings={mockMeetings}
        onNavigateToMeeting={mockNavigate}
        onToggleTodoCompletion={mockToggleTodo}
        initialExpanded={false}
        disabled={false}
      />,
    );

    // Expand the filter dashboard
    const toggleButton = screen.getByTitle("View Filters");
    fireEvent.click(toggleButton);

    // Type in search
    const searchInput = screen.getByPlaceholderText(
      /Search across all content/,
    ) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: "test search" } });
    fireEvent.input(searchInput, { target: { value: "test search" } });

    // Wait for state update
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(searchInput.value).toBe("test search");

    // Click clear button
    const clearButton = screen.getByTitle("Clear search");
    fireEvent.click(clearButton);

    // Wait for clear to take effect
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Check that input is cleared
    expect(searchInput.value).toBe("");
    // Clear button should be gone
    expect(screen.queryByTitle("Clear search")).toBeNull();
  });

  it("filters meetings based on search query in block content", async () => {
    renderWithI18n(
      <TestFilterWrapper
        mode="overview"
        meetings={mockMeetings}
        onNavigateToMeeting={mockNavigate}
        onToggleTodoCompletion={mockToggleTodo}
        initialExpanded={false}
        disabled={false}
      />,
    );

    // Expand the filter dashboard and select all filters to see content
    const toggleButton = screen.getByTitle("View Filters");
    fireEvent.click(toggleButton);

    // Select note filter to see the matching content
    const noteFilter = screen.getByLabelText("Notes");
    fireEvent.change(noteFilter, { target: { checked: true } });

    // Search for specific content
    const searchInput = screen.getByPlaceholderText(
      /Search across all content/,
    );
    fireEvent.change(searchInput, { target: { value: "search feature" } });
    fireEvent.input(searchInput, { target: { value: "search feature" } });

    // Wait for debounce and check results
    await waitFor(() => {
      // Should show meeting with matching content
      expect(screen.getByText("Sprint Planning Meeting")).toBeTruthy();
      // Should not show meeting without matching content
      expect(screen.queryByText("Code Review Session")).toBeFalsy();
    }, { timeout: 200 });
  });

  it("filters meetings based on search query in meeting title", async () => {
    renderWithI18n(
      <TestFilterWrapper
        mode="overview"
        meetings={mockMeetings}
        onNavigateToMeeting={mockNavigate}
        onToggleTodoCompletion={mockToggleTodo}
        initialExpanded={false}
        disabled={false}
      />,
    );

    // Expand the filter dashboard and select filters
    const toggleButton = screen.getByTitle("View Filters");
    fireEvent.click(toggleButton);

    // Select a filter to see content
    const issueFilter = screen.getByLabelText("Issues");
    fireEvent.click(issueFilter);

    // Search by meeting title
    const searchInput = screen.getByPlaceholderText(
      /Search across all content/,
    );
    fireEvent.change(searchInput, { target: { value: "Code Review" } });
    fireEvent.input(searchInput, { target: { value: "Code Review" } });

    // Wait for debounce and check results
    await waitFor(() => {
      // Should show meeting with matching title
      expect(screen.getByText("Code Review Session")).toBeTruthy();
      // Should not show meeting without matching title
      expect(screen.queryByText("Sprint Planning Meeting")).toBeFalsy();
    }, { timeout: 200 });
  });

  it("shows all meetings when search is cleared", async () => {
    renderWithI18n(
      <TestFilterWrapper
        mode="overview"
        meetings={mockMeetings}
        onNavigateToMeeting={mockNavigate}
        onToggleTodoCompletion={mockToggleTodo}
        initialExpanded={false}
        disabled={false}
      />,
    );

    // Expand the filter dashboard and select filters
    const toggleButton = screen.getByTitle("View Filters");
    fireEvent.click(toggleButton);

    // Select multiple filters to see all content
    const noteFilter = screen.getByLabelText("Notes");
    const issueFilter = screen.getByLabelText("Issues");
    fireEvent.click(noteFilter);
    fireEvent.click(issueFilter);

    // Initially should show both meetings
    // Sprint Planning has textblock (stories), Code Review has issueblock (issues)
    expect(screen.getByText("Sprint Planning Meeting")).toBeTruthy();
    expect(screen.getByText("Code Review Session")).toBeTruthy();

    // Search for specific content
    const searchInput = screen.getByPlaceholderText(
      /Search across all content/,
    );
    fireEvent.change(searchInput, { target: { value: "authentication" } });
    fireEvent.input(searchInput, { target: { value: "authentication" } });

    // Wait for search to filter results
    await waitFor(() => {
      // Since "authentication" doesn't match anything in the mock data,
      // NO meetings should be visible
      expect(screen.queryByText("Sprint Planning Meeting")).toBeFalsy();
      expect(screen.queryByText("Code Review Session")).toBeFalsy();
      // Should show "No results found"
      expect(screen.getByText(/No results found for "authentication"/))
        .toBeTruthy();
    }, { timeout: 200 });

    // Clear search
    const clearButton = screen.getByTitle("Clear search");
    fireEvent.click(clearButton);

    // Wait a moment for all state updates to complete
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Check if search indicators are gone
    expect(screen.queryByText(/Searching for:/)).toBeFalsy();

    // Wait and check that all meetings are shown again
    await waitFor(() => {
      expect(screen.getByText("Sprint Planning Meeting")).toBeTruthy();
      expect(screen.getByText("Code Review Session")).toBeTruthy();
    }, { timeout: 1000 });
  });

  it("performs case-insensitive search", async () => {
    renderWithI18n(
      <TestFilterWrapper
        mode="overview"
        meetings={mockMeetings}
        onNavigateToMeeting={mockNavigate}
        onToggleTodoCompletion={mockToggleTodo}
        initialExpanded={false}
        disabled={false}
      />,
    );

    // Expand the filter dashboard and select filters
    const toggleButton = screen.getByTitle("View Filters");
    fireEvent.click(toggleButton);

    const factFilter = screen.getByLabelText("Facts");
    fireEvent.change(factFilter, { target: { checked: true } });

    // Search with different case
    const searchInput = screen.getByPlaceholderText(
      /Search across all content/,
    );
    fireEvent.change(searchInput, { target: { value: "PERFORMANCE" } });
    fireEvent.input(searchInput, { target: { value: "PERFORMANCE" } });

    // Wait for debounce and check results
    await waitFor(() => {
      // Should find the meeting with "performance" (lowercase) in content
      expect(screen.getByText("Sprint Planning Meeting")).toBeTruthy();
    }, { timeout: 200 });
  });

  it("combines search with existing filters correctly", async () => {
    renderWithI18n(
      <TestFilterWrapper
        mode="overview"
        meetings={mockMeetings}
        onNavigateToMeeting={mockNavigate}
        onToggleTodoCompletion={mockToggleTodo}
        initialExpanded={false}
        disabled={false}
      />,
    );

    // Expand the filter dashboard
    const toggleButton = screen.getByTitle("View Filters");
    fireEvent.click(toggleButton);

    // First, uncheck the default Follow-ups filter since we only want TODOs
    // (TODOs Uncompleted and Follow-ups are defaults, we keep TODOs and remove Follow-ups)
    const followupsFilter = screen.getByLabelText("Follow-ups");
    fireEvent.click(followupsFilter);

    // Search for content that exists in a note block, not todo block
    const searchInput = screen.getByPlaceholderText(
      /Search across all content/,
    );
    fireEvent.change(searchInput, { target: { value: "search feature" } });
    fireEvent.input(searchInput, { target: { value: "search feature" } });

    // Wait for debounce - should show no results because "search feature"
    // is in a note block, but we're only filtering for todos
    await waitFor(() => {
      // The meeting contains the search term but not in TODO blocks
      // So it should be filtered out
      expect(screen.queryByText("Sprint Planning Meeting")).toBeFalsy();
    }, { timeout: 200 });

    // Now search for content that IS in a todo block
    fireEvent.change(searchInput, { target: { value: "Setup search" } });
    fireEvent.input(searchInput, { target: { value: "Setup search" } });

    await waitFor(() => {
      // This should show the meeting because "Setup search" is in a TODO block
      expect(screen.getByText("Sprint Planning Meeting")).toBeTruthy();
    }, { timeout: 200 });
  });
});
