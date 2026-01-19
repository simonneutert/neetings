import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { ImportExportButtons } from "../components/ImportExportButtons";
import { I18nProvider } from "../i18n";

describe("ImportExportButtons Component", () => {
  it("renders import and export buttons", () => {
    const mockOnImportMeetings = vi.fn();

    render(
      <I18nProvider>
        <ImportExportButtons
          meetings={[]}
          onImportMeetings={mockOnImportMeetings}
        />
      </I18nProvider>,
    );

    expect(screen.getByRole("button", { name: /Import Meetings/i }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export Meetings/i }))
      .toBeInTheDocument();
  });

  it("renders with light variant styling", () => {
    const mockOnImportMeetings = vi.fn();

    render(
      <I18nProvider>
        <ImportExportButtons
          meetings={[]}
          onImportMeetings={mockOnImportMeetings}
          variant="light"
        />
      </I18nProvider>,
    );

    const importButton = screen.getByRole("button", {
      name: /Import Meetings/i,
    });
    expect(importButton).toHaveClass("btn-outline-light");
  });

  it("renders with default variant styling", () => {
    const mockOnImportMeetings = vi.fn();

    render(
      <I18nProvider>
        <ImportExportButtons
          meetings={[]}
          onImportMeetings={mockOnImportMeetings}
          variant="default"
        />
      </I18nProvider>,
    );

    const importButton = screen.getByRole("button", {
      name: /Import Meetings/i,
    });
    expect(importButton).toHaveClass("btn-outline-primary");
  });

  it("shows alert when trying to export with no meetings", () => {
    const mockOnImportMeetings = vi.fn();
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <I18nProvider>
        <ImportExportButtons
          meetings={[]}
          onImportMeetings={mockOnImportMeetings}
        />
      </I18nProvider>,
    );

    const exportButton = screen.getByRole("button", {
      name: /Export Meetings/i,
    });
    fireEvent.click(exportButton);

    expect(alertSpy).toHaveBeenCalledWith("No meetings to export.");
    alertSpy.mockRestore();
  });
});
