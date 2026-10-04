import { screen } from "@testing-library/preact";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../index.tsx";
import { renderWithI18n } from "./testUtils.ts";

describe("Debug App Rendering", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.removeItem("lastView");
    localStorage.removeItem("meetings");
  });

  it("renders without crashing", () => {
    try {
      renderWithI18n(<App />);
      expect(screen.getAllByText("neetings").length)
        .toBeGreaterThan(0);
    } catch (error) {
      console.error("Render error:", error);
      throw error;
    }
  });
});
