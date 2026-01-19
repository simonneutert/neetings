import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { MIN_SEARCH_CHARACTERS, SEARCH_DEBOUNCE_DELAY } from "../constants";

interface UseDebounceSearchOptions {
  debounceDelay?: number;
  minLength?: number;
}

interface UseDebounceSearchResult {
  searchQuery: string;
  debouncedQuery: string;
  isSearching: boolean;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
}

export function useDebounceSearch(
  options: UseDebounceSearchOptions = {},
): UseDebounceSearchResult {
  const {
    debounceDelay = SEARCH_DEBOUNCE_DELAY,
    minLength = MIN_SEARCH_CHARACTERS,
  } = options;

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current);
    }

    if (searchQuery.length < minLength) {
      setDebouncedQuery("");
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    timeoutRef.current = window.setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, debounceDelay);

    return () => {
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery, debounceDelay, minLength]);

  const clearSearch = useCallback(() => {
    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    // Clear all states synchronously
    setSearchQuery("");
    setDebouncedQuery("");
    setIsSearching(false);
  }, []);

  return {
    searchQuery,
    debouncedQuery,
    isSearching,
    setSearchQuery,
    clearSearch,
  };
}
