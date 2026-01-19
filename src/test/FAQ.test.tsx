import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { FAQ } from "../components/FAQ";
import { I18nProvider } from "../i18n";

describe("FAQ Component", () => {
  it("renders FAQ title and questions", () => {
    const mockOnBackToMeetings = vi.fn();

    render(
      <I18nProvider>
        <FAQ
          onBackToMeetings={mockOnBackToMeetings}
          hasMeetings={true}
        />
      </I18nProvider>,
    );

    // Check if title is rendered
    expect(screen.getByText("Frequently Asked Questions"))
      .toBeInTheDocument();

    // Check if subtitle is rendered
    expect(screen.getByText("Everything you need to know about Neetings"))
      .toBeInTheDocument();

    // Check if Table of Contents is rendered
    expect(screen.getByText(/Table of Contents/)).toBeInTheDocument();

    // Check if the new Confluence™ question is rendered (first question in actual FAQ)
    expect(
      screen.getByRole("heading", {
        name: /Does Neetings work with Confluence™?/,
      }),
    )
      .toBeInTheDocument();

    // Check if at least one other question is rendered
    expect(
      screen.getByRole("heading", {
        name: /Why choose Neetings over traditional note-taking apps?/,
      }),
    ).toBeInTheDocument();

    // Check if the back button is rendered when meetings exist
    expect(screen.getByText("← Back to Meetings")).toBeInTheDocument();
  });

  it("calls onBackToMeetings when back button is clicked", () => {
    const mockOnBackToMeetings = vi.fn();

    render(
      <I18nProvider>
        <FAQ
          onBackToMeetings={mockOnBackToMeetings}
          hasMeetings={true}
        />
      </I18nProvider>,
    );

    const backButton = screen.getByText("← Back to Meetings");
    fireEvent.click(backButton);

    expect(mockOnBackToMeetings).toHaveBeenCalledTimes(1);
  });

  it("hides back button when no meetings exist", () => {
    const mockOnBackToMeetings = vi.fn();

    render(
      <I18nProvider>
        <FAQ
          onBackToMeetings={mockOnBackToMeetings}
          hasMeetings={false}
        />
      </I18nProvider>,
    );

    // Back button should not be present when no meetings exist
    expect(screen.queryByText("← Back to Meetings")).not
      .toBeInTheDocument();
  });

  it("displays call-to-action button that triggers onBackToMeetings", () => {
    const mockOnBackToMeetings = vi.fn();

    render(
      <I18nProvider>
        <FAQ onBackToMeetings={mockOnBackToMeetings} />
      </I18nProvider>,
    );

    const ctaButton = screen.getByText("🎯 Start Your First Meeting");
    fireEvent.click(ctaButton);

    expect(mockOnBackToMeetings).toHaveBeenCalledTimes(1);
  });

  it("renders multiple FAQ questions", () => {
    const mockOnBackToMeetings = vi.fn();

    render(
      <I18nProvider>
        <FAQ onBackToMeetings={mockOnBackToMeetings} />
      </I18nProvider>,
    );

    // Check for key questions as headings
    expect(
      screen.getByRole("heading", {
        name: /Is my meeting data secure and private?/,
      }),
    )
      .toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /How quickly can I get started?/ }),
    )
      .toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /What makes the block system so powerful?/,
      }),
    )
      .toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Can I organize complex meetings effectively?/,
      }),
    )
      .toBeInTheDocument();
  });
});
