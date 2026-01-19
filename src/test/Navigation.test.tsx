import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/preact";
import { h } from "preact";
import { Navigation } from "../components/Navigation";
import { renderWithI18n } from "./testUtils";

describe("Navigation Component", () => {
  beforeEach(() => {
    // Clear any previous renders
  });

  it("should not show Clear Meeting button when no meeting is selected", () => {
    renderWithI18n(<Navigation hasMeetingSelected={false} />);

    // The Clear Meeting button should not be in the document
    expect(screen.queryByText("Clear Meeting")).not.toBeInTheDocument();
  });

  it("should not show Clear Meeting button when hasMeetingSelected is undefined", () => {
    renderWithI18n(<Navigation />);

    // The Clear Meeting button should not be in the document
    expect(screen.queryByText("Clear Meeting")).not.toBeInTheDocument();
  });

  it("should show Clear Meeting button when a meeting is selected", () => {
    renderWithI18n(<Navigation hasMeetingSelected={true} />);

    // The Clear Meeting button should be visible
    expect(screen.getByText("Clear Meeting")).toBeInTheDocument();
  });

  it("should always show Clear All Data button regardless of meeting selection", () => {
    // Test with no meeting selected
    const { rerender } = renderWithI18n(
      <Navigation hasMeetingSelected={false} />,
    );
    expect(screen.getByText("Clear All Data")).toBeInTheDocument();

    // Test with meeting selected
    rerender(<Navigation hasMeetingSelected={true} />);
    expect(screen.getByText("Clear All Data")).toBeInTheDocument();
  });

  it("should always show Meetings link regardless of meeting selection", () => {
    // Test with no meeting selected
    const { rerender } = renderWithI18n(
      <Navigation hasMeetingSelected={false} />,
    );
    expect(screen.getByText("Meetings")).toBeInTheDocument();

    // Test with meeting selected
    rerender(<Navigation hasMeetingSelected={true} />);
    expect(screen.getByText("Meetings")).toBeInTheDocument();
  });
});
