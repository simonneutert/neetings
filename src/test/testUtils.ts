import { Block } from "../types/Block";
import { render } from "@testing-library/preact";
import { h } from "preact";
import { I18nProvider } from "../i18n/index";

// Custom render function that wraps components with I18nProvider
export const renderWithI18n = (ui: any, options = {}) => {
  const Wrapper = ({ children }: { children: any }) => {
    return h(I18nProvider, null, children);
  };

  return render(ui, { wrapper: Wrapper, ...options });
};

// Test data factories for creating realistic test data
export const createTestMeeting = (overrides = {}) => ({
  id: `test-meeting-${Date.now()}`,
  title: "Test Meeting",
  date: new Date().toISOString().slice(0, 10),
  startTime: "10:00",
  endTime: "11:00",
  blocks: [],
  topicGroups: [],
  attendeeIds: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createTestBlock = (type: Block["type"], overrides = {}): Block => {
  const baseBlock = {
    id: `test-block-${Date.now()}-${Math.random()}`,
    type,
    created_at: new Date().toISOString(),
    position: Date.now() + Math.random(), // Ensure unique positions
  };

  const blockData = {
    textblock: { text: "Test text content" },
    qandablock: { question: "Test question?", answer: "Test answer" },
    researchblock: {
      topic: "Test research topic",
      result: "Test research result",
    },
    factblock: { fact: "Test fact" },
    decisionblock: { decision: "Test decision" },
    issueblock: { issue: "Test issue" },
    todoblock: { todo: "Test todo" },
    goalblock: { goal: "Test goal" },
    followupblock: { followup: "Test followup" },
    ideablock: { idea: "Test idea" },
    referenceblock: { reference: "Test reference" },
  };

  return {
    ...baseBlock,
    ...blockData[type],
    ...overrides,
  } as Block;
};

// Helper to create meetings with various block types
export const createMeetingWithBlocks = () => {
  const meeting = createTestMeeting({
    title: "Meeting with All Block Types",
    blocks: [
      createTestBlock("textblock"),
      createTestBlock("qandablock"),
      createTestBlock("researchblock"),
      createTestBlock("factblock"),
      createTestBlock("decisionblock"),
      createTestBlock("issueblock"),
      createTestBlock("todoblock"),
      createTestBlock("goalblock"),
      createTestBlock("followupblock"),
      createTestBlock("ideablock"),
      createTestBlock("referenceblock"),
    ],
  });
  return meeting;
};

// Helper to wait for async operations (like auto-save)
export const waitForAutoSave = () =>
  new Promise((resolve) => setTimeout(resolve, 600));

// Helper to simulate file upload for import testing
export const createFileWithContent = (
  content: string,
  filename = "test.json",
) => {
  const blob = new Blob([content], { type: "application/json" });
  return new File([blob], filename, { type: "application/json" });
};
