import { act, renderHook } from "@testing-library/preact";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDebounceSearch } from "../hooks/useDebounceSearch";

describe("useDebounceSearch - isolated test", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should clear debouncedQuery immediately when clearSearch is called", () => {
    const { result } = renderHook(() => useDebounceSearch());

    // Set search query
    act(() => {
      result.current.setSearchQuery("test query");
    });

    // Wait for debounce
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Check that debounced query is set
    expect(result.current.debouncedQuery).toBe("test query");

    // Clear search
    act(() => {
      result.current.clearSearch();
    });

    // Check that everything is cleared immediately
    expect(result.current.searchQuery).toBe("");
    expect(result.current.debouncedQuery).toBe("");
    expect(result.current.isSearching).toBe(false);
  });
});
