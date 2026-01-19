import { fireEvent, render, screen } from "@testing-library/preact";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BlockTypeModal } from "../components/BlockTypeModal";
import { I18nProvider } from "../i18n"; // Import I18nProvider

describe("BlockTypeModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSelectType = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders modal when isOpen is true", () => {
    render(
      <I18nProvider>
        <BlockTypeModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectType={mockOnSelectType}
          topicGroupName="Test Topic"
        />
      </I18nProvider>,
    );

    expect(screen.getByText("Choose Block Type")).toBeInTheDocument();
    expect(screen.getByText("Adding to: Test Topic")).toBeInTheDocument();
  });

  it("does not render modal when isOpen is false", () => {
    render(
      <I18nProvider>
        <BlockTypeModal
          isOpen={false}
          onClose={mockOnClose}
          onSelectType={mockOnSelectType}
          topicGroupName="Test Topic"
        />
      </I18nProvider>,
    );

    expect(screen.queryByText("Choose Block Type")).not.toBeInTheDocument();
  });

  it("displays all block types", () => {
    render(
      <I18nProvider>
        <BlockTypeModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectType={mockOnSelectType}
          topicGroupName="Test Topic"
        />
      </I18nProvider>,
    );

    // Check for some key block types using actual labels from BLOCK_TYPES
    expect(screen.getByText("Note")).toBeInTheDocument();
    expect(screen.getByText("TODO")).toBeInTheDocument();
    expect(screen.getByText("Decision")).toBeInTheDocument();
    expect(screen.getByText("Goal")).toBeInTheDocument();
    expect(screen.getByText("Follow-up")).toBeInTheDocument();
    expect(screen.getByText("Idea")).toBeInTheDocument();
  });

  it("calls onSelectType when a block type is clicked", () => {
    render(
      <I18nProvider>
        <BlockTypeModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectType={mockOnSelectType}
          topicGroupName="Test Topic"
        />
      </I18nProvider>,
    );

    const noteButton = screen.getByText("Note");
    fireEvent.click(noteButton);

    expect(mockOnSelectType).toHaveBeenCalledWith("textblock");
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <I18nProvider>
        <BlockTypeModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectType={mockOnSelectType}
          topicGroupName="Test Topic"
        />
      </I18nProvider>,
    );

    const closeButton = screen.getByText("×");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when backdrop is clicked", () => {
    render(
      <I18nProvider>
        <BlockTypeModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectType={mockOnSelectType}
          topicGroupName="Test Topic"
        />
      </I18nProvider>,
    );

    const backdrop = screen.getByTestId("modal-backdrop");
    fireEvent.click(backdrop);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when Escape key is pressed", () => {
    render(
      <I18nProvider>
        <BlockTypeModal
          isOpen={true}
          onClose={mockOnClose}
          onSelectType={mockOnSelectType}
          topicGroupName="Test Topic"
        />
      </I18nProvider>,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockOnClose).toHaveBeenCalled();
  });
});
