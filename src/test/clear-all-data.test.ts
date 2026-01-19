import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/preact";
import { useMeetingState } from "../hooks/useMeetingState";
import { useGlobalAttendees } from "../hooks/useGlobalAttendees";
import { createAttendee } from "../types/Attendee";
import { createEmptyMeeting } from "../types/Meeting";
import { APP_CONFIG } from "../constants/index";

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    getAllKeys: () => Object.keys(store), // Helper for testing
    getStore: () => ({ ...store }), // Helper for testing
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

describe("Clear All Data Functionality", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe("Clear All Data Bug Fix", () => {
    it("should clear ALL localStorage data including attendees and language", async () => {
      // Setup: Add data to localStorage for all known keys
      const testMeetings = [createEmptyMeeting("test-meeting-1")];
      const testAttendees = [createAttendee("Test User", "test@example.com")];

      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
        JSON.stringify(testMeetings),
      );
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.LAST_VIEW,
        "test-meeting-1",
      );
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
        JSON.stringify(testAttendees),
      );
      localStorage.setItem(APP_CONFIG.LOCAL_STORAGE_KEYS.LANGUAGE, "de");
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.FILTER_PREFERENCES,
        JSON.stringify({ selectedFilters: ["facts", "qandas"] }),
      );

      // Verify data is present before clearing
      expect(localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS))
        .toBeTruthy();
      expect(localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.LAST_VIEW))
        .toBeTruthy();
      expect(localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES))
        .toBeTruthy();
      expect(localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.LANGUAGE))
        .toBeTruthy();
      expect(
        localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.FILTER_PREFERENCES),
      )
        .toBeTruthy();

      // Execute: Call clearAllData
      const { result } = renderHook(() => useMeetingState());

      act(() => result.current.clearAllData());

      // Verify: ALL localStorage data should be cleared
      expect(localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS))
        .toBeNull();
      expect(localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.LAST_VIEW))
        .toBeNull();
      expect(localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES))
        .toBeNull();
      expect(localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.LANGUAGE))
        .toBeNull();
      expect(
        localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.FILTER_PREFERENCES),
      )
        .toBeNull();

      // Verify: Meeting state should be reset
      expect(result.current.meetings).toEqual([]);
      expect(result.current.selectedMeetingId).toBeNull();
    });

    it("should clear attendees data so useGlobalAttendees returns empty array", async () => {
      // Setup: Add attendees data
      const testAttendees = [
        createAttendee("User 1", "user1@example.com"),
        createAttendee("User 2", "user2@example.com"),
      ];
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES,
        JSON.stringify(testAttendees),
      );

      // Verify attendees exist before clearing
      const { result: attendeesResult } = renderHook(() =>
        useGlobalAttendees()
      );

      // Wait for useGlobalAttendees to load
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(attendeesResult.current.attendees).toHaveLength(2);

      // Execute: Clear all data
      const { result: meetingResult } = renderHook(() => useMeetingState());

      act(() => {
        meetingResult.current.clearAllData();
      });

      // Verify: Attendees localStorage is cleared
      expect(localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES))
        .toBeNull();

      // Create new hook instance (simulating page reload effect)
      const { result: newAttendeesResult } = renderHook(() =>
        useGlobalAttendees()
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Verify: New instance shows empty attendees
      expect(newAttendeesResult.current.attendees).toEqual([]);
    });

    it("should handle clearing when some localStorage keys don't exist", () => {
      // Setup: Only set some keys
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
        JSON.stringify([]),
      );
      // Don't set attendees, language, or lastView

      const { result } = renderHook(() => useMeetingState());

      // Execute: Should not throw error when trying to remove non-existent keys
      expect(() => {
        act(() => {
          result.current.clearAllData();
        });
      }).not.toThrow();

      // Verify: All keys are removed (or remain null)
      expect(localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS))
        .toBeNull();
      expect(localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.LAST_VIEW))
        .toBeNull();
      expect(localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES))
        .toBeNull();
      expect(localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.LANGUAGE))
        .toBeNull();
    });
  });

  describe("Data Persistence Prevention", () => {
    it("should ensure no localStorage data survives clearAllData", () => {
      // Setup: Fill localStorage with all possible app data
      const testData = {
        [APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS]: JSON.stringify([
          createEmptyMeeting("test"),
        ]),
        [APP_CONFIG.LOCAL_STORAGE_KEYS.LAST_VIEW]: "test-view",
        [APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES]: JSON.stringify([
          createAttendee("Test"),
        ]),
        [APP_CONFIG.LOCAL_STORAGE_KEYS.LANGUAGE]: "de",
        [APP_CONFIG.LOCAL_STORAGE_KEYS.FILTER_PREFERENCES]: JSON.stringify({
          selectedFilters: ["facts", "qandas"],
        }),
      };

      // Add all test data
      Object.entries(testData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      // Verify all data is present
      Object.keys(testData).forEach((key) => {
        expect(localStorage.getItem(key)).toBeTruthy();
      });

      // Execute: Clear all data
      const { result } = renderHook(() => useMeetingState());

      act(() => {
        result.current.clearAllData();
      });

      // Verify: ABSOLUTELY NO localStorage data remains
      Object.keys(testData).forEach((key) => {
        expect(localStorage.getItem(key)).toBeNull();
      });

      // Extra verification: Check that localStorage is completely empty for our keys
      const allKeys = (mockLocalStorage as any).getAllKeys();
      const appKeys = Object.values(APP_CONFIG.LOCAL_STORAGE_KEYS);

      appKeys.forEach((appKey) => {
        expect(allKeys).not.toContain(appKey);
      });
    });

    it("should prevent data leakage by clearing all known storage keys", () => {
      // This test ensures we're not missing any localStorage keys in the future
      const knownStorageKeys = Object.values(APP_CONFIG.LOCAL_STORAGE_KEYS);

      // Setup: Add data to all known keys
      knownStorageKeys.forEach((key, index) => {
        localStorage.setItem(key, `test-data-${index}`);
      });

      // Verify setup
      knownStorageKeys.forEach((key) => {
        expect(localStorage.getItem(key)).toBeTruthy();
      });

      // Execute
      const { result } = renderHook(() => useMeetingState());

      act(() => {
        result.current.clearAllData();
      });

      // Verify: Every known key is cleared
      knownStorageKeys.forEach((key) => {
        expect(localStorage.getItem(key)).toBeNull();
      });
    });
  });

  describe("State Management After Clear", () => {
    it("should reset meeting state correctly after clearing", () => {
      // Setup
      const testMeetings = [
        createEmptyMeeting("meeting-1"),
        createEmptyMeeting("meeting-2"),
      ];

      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
        JSON.stringify(testMeetings),
      );
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.LAST_VIEW,
        "meeting-1",
      );

      const { result } = renderHook(() => useMeetingState());

      // Verify initial state (should load from localStorage)
      expect(result.current.meetings).toHaveLength(2);
      expect(result.current.selectedMeetingId).toBe("meeting-1");

      // Execute
      act(() => {
        result.current.clearAllData();
      });

      // Verify: State is properly reset
      expect(result.current.meetings).toEqual([]);
      expect(result.current.selectedMeetingId).toBeNull();
    });

    it("should handle multiple clearAllData calls safely", () => {
      // Setup
      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
        JSON.stringify([createEmptyMeeting("test")]),
      );

      const { result } = renderHook(() => useMeetingState());

      // Execute: Call clearAllData multiple times
      act(() => {
        result.current.clearAllData();
        result.current.clearAllData();
        result.current.clearAllData();
      });

      // Verify: Should not throw errors and data should remain cleared
      expect(localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS))
        .toBeNull();
      expect(localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES))
        .toBeNull();
      expect(result.current.meetings).toEqual([]);
      expect(result.current.selectedMeetingId).toBeNull();
    });
  });

  describe("Centralized Storage Key Management", () => {
    it("should use centralized storage keys from APP_CONFIG", () => {
      // This test ensures we're using centralized constants
      const storageKeys = APP_CONFIG.LOCAL_STORAGE_KEYS;

      expect(storageKeys.MEETINGS).toBe("meetings");
      expect(storageKeys.LAST_VIEW).toBe("lastView");
      expect(storageKeys.ATTENDEES).toBe("attendees");
      expect(storageKeys.LANGUAGE).toBe("language");
      expect(storageKeys.FILTER_PREFERENCES).toBe("filterPreferences");
    });

    it("should clear all keys defined in APP_CONFIG.LOCAL_STORAGE_KEYS", () => {
      // Setup: Add data for all centralized keys
      const storageKeys = APP_CONFIG.LOCAL_STORAGE_KEYS;

      Object.values(storageKeys).forEach((key) => {
        localStorage.setItem(key, "test-data");
      });

      // Execute
      const { result } = renderHook(() => useMeetingState());

      act(() => {
        result.current.clearAllData();
      });

      // Verify: All centralized keys are cleared
      Object.values(storageKeys).forEach((key) => {
        expect(localStorage.getItem(key)).toBeNull();
      });
    });
  });
});
