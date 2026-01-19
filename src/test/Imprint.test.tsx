import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { Imprint } from "../components/Imprint";
import { I18nProvider } from "../i18n";

describe("Imprint Component", () => {
  it("renders Imprint title and content sections", () => {
    const mockOnBackToMeetings = vi.fn();

    render(
      <I18nProvider>
        <Imprint
          onBackToMeetings={mockOnBackToMeetings}
          hasMeetings={true}
        />
      </I18nProvider>,
    );

    // Check if title is rendered
    expect(screen.getByText("Imprint")).toBeInTheDocument();

    // Check if legal notice section is rendered
    expect(screen.getByText("Information according to §5 TMG"))
      .toBeInTheDocument();

    // Check if personal info is rendered
    expect(screen.getByText("Simon Neutert")).toBeInTheDocument();
    expect(screen.getByText("Postfach 1120, 55258 Ingelheim"))
      .toBeInTheDocument();

    // Check if EU Dispute Resolution section is rendered
    expect(screen.getByText("EU Dispute Resolution")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The European Commission provides a platform for online dispute resolution (ODR):",
      ),
    ).toBeInTheDocument();

    // Check if Consumer Dispute Resolution section is rendered
    expect(
      screen.getByText("Consumer Dispute Resolution/Universal Arbitration"),
    ).toBeInTheDocument();

    // Check if the back button is rendered when meetings exist
    expect(screen.getByText("← Back to Meetings")).toBeInTheDocument();
  });

  it("calls onBackToMeetings when back button is clicked", () => {
    const mockOnBackToMeetings = vi.fn();

    render(
      <I18nProvider>
        <Imprint
          onBackToMeetings={mockOnBackToMeetings}
          hasMeetings={true}
        />
      </I18nProvider>,
    );

    const backButton = screen.getByText("← Back to Meetings");
    fireEvent.click(backButton);

    expect(mockOnBackToMeetings).toHaveBeenCalledTimes(1);
  });

  it("does not render back button when hasMeetings is false", () => {
    const mockOnBackToMeetings = vi.fn();

    render(
      <I18nProvider>
        <Imprint
          onBackToMeetings={mockOnBackToMeetings}
          hasMeetings={false}
        />
      </I18nProvider>,
    );

    expect(screen.queryByText("← Back to Meetings")).not.toBeInTheDocument();
  });

  it("renders call-to-action section when hasMeetings is false", () => {
    const mockOnBackToMeetings = vi.fn();

    render(
      <I18nProvider>
        <Imprint
          onBackToMeetings={mockOnBackToMeetings}
          hasMeetings={false}
        />
      </I18nProvider>,
    );

    // Check if CTA section is rendered
    expect(
      screen.getByText("Ready to Transform Your Meetings? 🚀"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Join teams who've already eliminated meeting chaos. Try Neetings now - no installation required!",
      ),
    ).toBeInTheDocument();

    // Check if CTA button is rendered
    expect(screen.getByText("🎯 Start Your First Meeting")).toBeInTheDocument();
  });

  it("calls onBackToMeetings when CTA button is clicked", () => {
    const mockOnBackToMeetings = vi.fn();

    render(
      <I18nProvider>
        <Imprint
          onBackToMeetings={mockOnBackToMeetings}
          hasMeetings={false}
        />
      </I18nProvider>,
    );

    const ctaButton = screen.getByText("🎯 Start Your First Meeting");
    fireEvent.click(ctaButton);

    expect(mockOnBackToMeetings).toHaveBeenCalledTimes(1);
  });

  it("does not render call-to-action section when hasMeetings is true", () => {
    const mockOnBackToMeetings = vi.fn();

    render(
      <I18nProvider>
        <Imprint
          onBackToMeetings={mockOnBackToMeetings}
          hasMeetings={true}
        />
      </I18nProvider>,
    );

    expect(
      screen.queryByText("Ready to Transform Your Meetings? 🚀"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("🎯 Start Your First Meeting"),
    ).not.toBeInTheDocument();
  });

  it("renders EU Dispute Resolution link with correct attributes", () => {
    const mockOnBackToMeetings = vi.fn();

    render(
      <I18nProvider>
        <Imprint
          onBackToMeetings={mockOnBackToMeetings}
          hasMeetings={true}
        />
      </I18nProvider>,
    );

    const euLink = screen.getByText("Here's the link");
    expect(euLink).toBeInTheDocument();
    expect(euLink).toHaveAttribute(
      "href",
      "https://ec.europa.eu/consumers/odr/",
    );
    expect(euLink).toHaveAttribute("target", "_blank");
    expect(euLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders all required content sections", () => {
    const mockOnBackToMeetings = vi.fn();

    render(
      <I18nProvider>
        <Imprint
          onBackToMeetings={mockOnBackToMeetings}
          hasMeetings={true}
        />
      </I18nProvider>,
    );

    // Verify all main content sections are present
    const sections = [
      "Information according to §5 TMG",
      "EU Dispute Resolution",
      "Consumer Dispute Resolution/Universal Arbitration",
    ];

    sections.forEach((section) => {
      expect(screen.getByText(section)).toBeInTheDocument();
    });
  });

  it("has proper responsive design with card layout", () => {
    const mockOnBackToMeetings = vi.fn();

    render(
      <I18nProvider>
        <Imprint
          onBackToMeetings={mockOnBackToMeetings}
          hasMeetings={true}
        />
      </I18nProvider>,
    );

    // Check if cards are present (by checking for card class)
    const cards = document.querySelectorAll(".card");
    expect(cards.length).toBeGreaterThan(0);

    // Check if main container has proper styling
    const mainContainer = document.querySelector(
      'div[style*="max-width: 800px"], div[style*="maxWidth: 800px"]',
    );
    expect(mainContainer).toBeInTheDocument();
  });
});
