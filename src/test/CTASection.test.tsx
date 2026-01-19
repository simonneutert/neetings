import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { CTASection } from "../components/CTASection";
import { I18nProvider } from "../i18n";

describe("CTASection Component", () => {
  it("renders CTA content when show is true", () => {
    const mockOnButtonClick = vi.fn();

    render(
      <I18nProvider>
        <CTASection onButtonClick={mockOnButtonClick} show={true} />
      </I18nProvider>,
    );

    // Check if title is rendered
    expect(
      screen.getByText("Ready to Transform Your Meetings? 🚀"),
    ).toBeInTheDocument();

    // Check if description is rendered
    expect(
      screen.getByText(
        "Join teams who've already eliminated meeting chaos. Try Neetings now - no installation required!",
      ),
    ).toBeInTheDocument();

    // Check if button is rendered
    expect(screen.getByText("🎯 Start Your First Meeting")).toBeInTheDocument();
  });

  it("does not render when show is false", () => {
    const mockOnButtonClick = vi.fn();

    render(
      <I18nProvider>
        <CTASection onButtonClick={mockOnButtonClick} show={false} />
      </I18nProvider>,
    );

    // Check that nothing is rendered
    expect(
      screen.queryByText("Ready to Transform Your Meetings? 🚀"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("🎯 Start Your First Meeting"),
    ).not.toBeInTheDocument();
  });

  it("calls onButtonClick when button is clicked", () => {
    const mockOnButtonClick = vi.fn();

    render(
      <I18nProvider>
        <CTASection onButtonClick={mockOnButtonClick} show={true} />
      </I18nProvider>,
    );

    const button = screen.getByText("🎯 Start Your First Meeting");
    fireEvent.click(button);

    expect(mockOnButtonClick).toHaveBeenCalledTimes(1);
  });

  it("shows by default when show prop is not provided", () => {
    const mockOnButtonClick = vi.fn();

    render(
      <I18nProvider>
        <CTASection onButtonClick={mockOnButtonClick} />
      </I18nProvider>,
    );

    // Should render by default
    expect(
      screen.getByText("Ready to Transform Your Meetings? 🚀"),
    ).toBeInTheDocument();
  });

  it("has proper styling with gradient background", () => {
    const mockOnButtonClick = vi.fn();

    render(
      <I18nProvider>
        <CTASection onButtonClick={mockOnButtonClick} show={true} />
      </I18nProvider>,
    );

    // Check if card is present with gradient background
    const card = document.querySelector(".card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveStyle(
      "background: linear-gradient(135deg, #28a745 0%, #20c997 100%)",
    );
  });

  it("has accessible button with proper styling", () => {
    const mockOnButtonClick = vi.fn();

    render(
      <I18nProvider>
        <CTASection onButtonClick={mockOnButtonClick} show={true} />
      </I18nProvider>,
    );

    const button = screen.getByRole("button", {
      name: "🎯 Start Your First Meeting",
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("btn", "btn-light", "btn-lg", "text-success");
  });
});
