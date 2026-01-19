import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { h } from "preact";
import { useState } from "preact/hooks";
import { UnifiedFilter } from "../components/UnifiedFilter";
import { renderWithI18n } from "./testUtils";

// Helper to render UnifiedFilter component with i18n context in overview mode
// Test wrapper component that manages filter state
const TestFilterWrapper = ({ initialExpanded = false, ...props }) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  return h(UnifiedFilter, {
    isExpanded,
    onToggleExpanded: () => setIsExpanded(!isExpanded),
    ...props,
  });
};

const renderFilter = (props = {}) => {
  const defaultProps = {
    mode: "overview" as const,
    meetings: [],
    onNavigateToMeeting: vi.fn(),
    onToggleTodoCompletion: vi.fn(),
    disabled: false,
  };

  return renderWithI18n(
    h(TestFilterWrapper, { ...defaultProps, ...props }),
  );
};

// Mock test data
const createMockMeeting = (id: string, blocks: any[] = []) => ({
  id,
  title: `Meeting ${id}`,
  date: "2024-01-01",
  startTime: "10:00",
  endTime: "11:00",
  blocks,
  attendeeIds: [],
  topicGroups: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const createMockBlock = (type: string, overrides = {}) => ({
  id: `block-${Date.now()}-${Math.random()}`,
  type,
  created_at: new Date().toISOString(),
  topicGroupId: undefined,
  sortKey: `a${Date.now()}`,
  ...overrides,
});

describe("Filter Component Unit Tests", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Basic Rendering", () => {
    it("renders the filter toggle button", () => {
      renderFilter();
      expect(screen.getByRole("button", { name: /view filters/i }))
        .toBeInTheDocument();
    });

    it("shows expanded filter panel when toggle is clicked", async () => {
      renderFilter();

      const toggleButton = screen.getByRole("button", {
        name: /view filters/i,
      });
      await user.click(toggleButton);

      expect(screen.getByText("Content Types")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search across all content/i))
        .toBeInTheDocument();
    });
  });

  describe("Checkbox Behavior", () => {
    const meetingsWithBlocks = [
      createMockMeeting("1", [
        createMockBlock("todoblock", { todo: "Test todo", completed: false }),
        createMockBlock("followupblock", { followup: "Test followup" }),
        createMockBlock("factblock", { fact: "Test fact" }),
      ]),
    ];

    it("shows default filters selected (Uncompleted TODOs and Follow-ups)", async () => {
      renderFilter({ meetings: meetingsWithBlocks });

      const toggleButton = screen.getByRole("button", {
        name: /view filters/i,
      });
      await user.click(toggleButton);

      const uncompletedCheckbox = screen.getByLabelText("Uncompleted TODOs");
      const followupsCheckbox = screen.getByLabelText("Follow-ups");
      const factsCheckbox = screen.getByLabelText("Facts");

      expect(uncompletedCheckbox).toBeChecked();
      expect(followupsCheckbox).toBeChecked();
      expect(factsCheckbox).not.toBeChecked();
    });

    it("allows unchecking all filters", async () => {
      renderFilter({ meetings: meetingsWithBlocks });

      const toggleButton = screen.getByRole("button", {
        name: /view filters/i,
      });
      await user.click(toggleButton);

      const uncompletedCheckbox = screen.getByLabelText("Uncompleted TODOs");
      const followupsCheckbox = screen.getByLabelText("Follow-ups");

      // Uncheck both default filters
      await user.click(uncompletedCheckbox);
      await user.click(followupsCheckbox);

      expect(uncompletedCheckbox).not.toBeChecked();
      expect(followupsCheckbox).not.toBeChecked();

      // Should show "no filters selected" message
      expect(screen.getByText(/showing: no filters selected/i))
        .toBeInTheDocument();
    });

    it("allows independent checkbox selection", async () => {
      renderFilter({ meetings: meetingsWithBlocks });

      const toggleButton = screen.getByRole("button", {
        name: /view filters/i,
      });
      await user.click(toggleButton);

      const uncompletedCheckbox = screen.getByLabelText("Uncompleted TODOs");
      const followupsCheckbox = screen.getByLabelText("Follow-ups");
      const factsCheckbox = screen.getByLabelText("Facts");

      // Uncheck defaults
      await user.click(uncompletedCheckbox);
      await user.click(followupsCheckbox);

      // Select Facts only
      await user.click(factsCheckbox);

      expect(factsCheckbox).toBeChecked();
      expect(uncompletedCheckbox).not.toBeChecked();
      expect(followupsCheckbox).not.toBeChecked();

      expect(screen.getByText(/showing: Facts/i)).toBeInTheDocument();
    });

    it("allows multiple independent selections", async () => {
      renderFilter({ meetings: meetingsWithBlocks });

      const toggleButton = screen.getByRole("button", {
        name: /view filters/i,
      });
      await user.click(toggleButton);

      const uncompletedCheckbox = screen.getByLabelText("Uncompleted TODOs");
      const factsCheckbox = screen.getByLabelText("Facts");
      const qandaCheckbox = screen.getByLabelText("Q&As");

      // Uncheck default
      await user.click(uncompletedCheckbox);

      // Select Facts and Q&As
      await user.click(factsCheckbox);
      await user.click(qandaCheckbox);

      expect(factsCheckbox).toBeChecked();
      expect(qandaCheckbox).toBeChecked();
      expect(uncompletedCheckbox).not.toBeChecked();

      const showingText = screen.getByText(/showing:/i).textContent;
      expect(showingText).toContain("Facts");
      expect(showingText).toContain("Q&As");
    });
  });

  describe("Search Functionality", () => {
    const meetingsWithContent = [
      createMockMeeting("1", [
        createMockBlock("textblock", { text: "Important meeting notes" }),
        createMockBlock("todoblock", {
          todo: "Review documentation",
          completed: false,
        }),
      ]),
      createMockMeeting("2", [
        createMockBlock("factblock", { fact: "Key findings from research" }),
      ]),
    ];

    it("shows search input when filter panel is expanded", async () => {
      renderFilter({ meetings: meetingsWithContent });

      const toggleButton = screen.getByRole("button", {
        name: /view filters/i,
      });
      await user.click(toggleButton);

      expect(screen.getByPlaceholderText(/search across all content/i))
        .toBeInTheDocument();
    });

    it("filters meetings based on search input", async () => {
      renderFilter({ meetings: meetingsWithContent });

      const toggleButton = screen.getByRole("button", {
        name: /view filters/i,
      });
      await user.click(toggleButton);

      const searchInput = screen.getByPlaceholderText(
        /search across all content/i,
      );
      await user.type(searchInput, "documentation");

      // Wait for debounced search
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Should show results containing "documentation"
      expect(screen.getByText(/Review documentation/)).toBeInTheDocument();
    });

    it("shows search input accepts text input", async () => {
      renderFilter({ meetings: meetingsWithContent });

      const toggleButton = screen.getByRole("button", {
        name: /view filters/i,
      });
      await user.click(toggleButton);

      const searchInput = screen.getByPlaceholderText(
        /search across all content/i,
      );
      await user.type(searchInput, "test");

      expect(searchInput).toHaveValue("test");
    });
  });

  describe("Date Range Functionality", () => {
    const meetingsWithDates = [
      createMockMeeting("recent", [
        createMockBlock("textblock", { text: "Recent meeting" }),
      ]),
      createMockMeeting("old", [
        createMockBlock("textblock", { text: "Old meeting" }),
      ]),
    ];

    // Update dates for realistic testing
    meetingsWithDates[0].created_at = "2024-06-01T10:00:00Z";
    meetingsWithDates[1].created_at = "2024-01-01T10:00:00Z";

    it("shows date range controls when expanded", async () => {
      renderFilter({ meetings: meetingsWithDates });

      const toggleButton = screen.getByRole("button", {
        name: /view filters/i,
      });
      await user.click(toggleButton);

      expect(screen.getByText("📅 Filter by Meeting Date")).toBeInTheDocument();
      expect(screen.getByText("From:")).toBeInTheDocument();
      expect(screen.getByText("To:")).toBeInTheDocument();
    });

    it("shows meeting count for date range", async () => {
      renderFilter({ meetings: meetingsWithDates });

      const toggleButton = screen.getByRole("button", {
        name: /view filters/i,
      });
      await user.click(toggleButton);

      expect(screen.getByText(/\d+ meeting[s]? in selected range/))
        .toBeInTheDocument();
    });

    it("has Past 10 and Show All buttons", async () => {
      renderFilter({ meetings: meetingsWithDates });

      const toggleButton = screen.getByRole("button", {
        name: /view filters/i,
      });
      await user.click(toggleButton);

      expect(screen.getByRole("button", { name: /past 10/i }))
        .toBeInTheDocument();
      expect(screen.getByRole("button", { name: /show all/i }))
        .toBeInTheDocument();
    });
  });

  describe("Empty States", () => {
    it("shows appropriate message when no meetings", () => {
      renderFilter({ meetings: [] });

      // Should render without errors even with no meetings
      expect(screen.getByRole("button", { name: /view filters/i }))
        .toBeInTheDocument();
    });

    it("shows help message when no filters selected", async () => {
      const meetings = [
        createMockMeeting("1", [
          createMockBlock("todoblock", { todo: "Test", completed: false }),
        ]),
      ];
      renderFilter({ meetings });

      const toggleButton = screen.getByRole("button", {
        name: /view filters/i,
      });
      await user.click(toggleButton);

      // Uncheck all defaults
      const uncompletedCheckbox = screen.getByLabelText("Uncompleted TODOs");
      const followupsCheckbox = screen.getByLabelText("Follow-ups");

      await user.click(uncompletedCheckbox);
      await user.click(followupsCheckbox);

      expect(screen.getByText(/please select at least one filter/i))
        .toBeInTheDocument();
    });
  });
});
