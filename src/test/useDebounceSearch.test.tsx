import { describe, expect, it } from "vitest";
import { render } from "@testing-library/preact";
import { useDebounceSearch } from "../hooks/useDebounceSearch";

// Simple test component that uses the hook
function TestComponent() {
  const { searchQuery, setSearchQuery } = useDebounceSearch();

  return (
    <div>
      <input
        data-testid="search-input"
        value={searchQuery}
        onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
      />
      <span data-testid="search-query">{searchQuery}</span>
    </div>
  );
}

describe("useDebounceSearch Hook", () => {
  it("should render without crashing", () => {
    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId("search-input")).toBeTruthy();
    expect(getByTestId("search-query")).toBeTruthy();
  });
});
