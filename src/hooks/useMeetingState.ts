import { useEffect, useRef, useState } from "preact/hooks";
import { generateUUID } from "../utils/uuid";
import {
  createEmptyMeeting,
  Meeting,
  MeetingUpdateData,
  updateMeetingTimestamp,
} from "../types/Meeting";
import { TopicGroup } from "../types/TopicGroup";
import { normalizeTopicGroupId } from "../types/Block";
import { APP_CONFIG } from "../constants/index";
import { MeetingUpdateQueue } from "../utils/MeetingUpdateQueue";
import { checkMemoryUsage } from "../utils/securityValidation";
import {
  MeetingSeriesType,
  migrateLegacyMeetingsToSeries,
} from "../schemas/meetingSeries";

export function useMeetingState() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    null,
  );
  // Series-level state - initialize with empty strings to avoid defaults override
  const [seriesTitle, setSeriesTitle] = useState<string>("");
  const [seriesAgenda, setSeriesAgenda] = useState<string>("");

  const hasInitialized = useRef(false);
  const updateQueue = useRef<MeetingUpdateQueue | null>(null);
  const lastMemoryCheck = useRef<number>(0);
  const MEMORY_CHECK_THROTTLE = 5000; // Check memory usage at most once every 5 seconds

  // Series update debouncing
  const seriesUpdateTimeout = useRef<NodeJS.Timeout | null>(null);

  /**
   * Saves the complete series data (title, agenda, meetings) to localStorage
   */
  const saveSeriesDataToStorage = (title?: string, agenda?: string) => {
    if (!updateQueue.current) return;

    try {
      const seriesData: MeetingSeriesType = {
        title: title ?? seriesTitle,
        agenda: agenda ?? seriesAgenda,
        meetings: updateQueue.current.getMeetings(),
        created_at: new Date().toISOString(), // We don't track this properly yet, but schema requires it
        updated_at: new Date().toISOString(),
      };

      localStorage.setItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
        JSON.stringify(seriesData),
      );
    } catch (error) {
      console.error("Failed to save series data to localStorage:", error);
    }
  };

  // Load initial state
  useEffect(() => {
    if (hasInitialized.current) return;

    const saved = localStorage.getItem(APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS);
    const lastView = localStorage.getItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.LAST_VIEW,
    );

    let initialMeetings: Meeting[] = [];
    let initialSeriesTitle = "";
    let initialSeriesAgenda = "";

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        // Migrate legacy format or parse series format
        const series = migrateLegacyMeetingsToSeries(parsed);

        // Extract series data
        initialSeriesTitle = series.title;
        initialSeriesAgenda = series.agenda;

        // Validate and clean up meetings - remove invalid blocks
        initialMeetings = series.meetings.map((meeting): Meeting => ({
          id: meeting.id || generateUUID(),
          title: meeting.title || APP_CONFIG.DEFAULT_VALUES.MEETING_TITLE,
          date: meeting.date || new Date().toISOString().slice(0, 10),
          startTime: meeting.startTime || "",
          endTime: meeting.endTime || "",
          attendeeIds: meeting.attendeeIds || [],
          created_at: meeting.created_at || new Date().toISOString(),
          updated_at: meeting.updated_at || new Date().toISOString(),
          topicGroups: (meeting.topicGroups || []).map((tg) => ({
            id: tg.id || generateUUID(),
            name: tg.name || "Untitled Topic",
            color: tg.color,
            order: tg.order || 0,
            meetingId: tg.meetingId || meeting.id || generateUUID(),
            createdAt: tg.createdAt || new Date().toISOString(),
            updatedAt: tg.updatedAt || new Date().toISOString(),
          })),
          blocks: (meeting.blocks || []).filter((block) => {
            // For now, just validate that blocks have required fields
            // In the future, all blocks will be created with proper structure
            return block.id && block.type && block.created_at;
          }).map((block) => ({
            ...block,
            // Ensure consistent topicGroupId normalization
            topicGroupId: normalizeTopicGroupId(block.topicGroupId),
            // Ensure sortKey exists (temporary fallback for existing data)
            sortKey: block.sortKey || `fallback_${Date.now()}_${Math.random()}`,
          })) as any, // Temporary cast for migration
        }));

        // Restore last view
        if (
          lastView && lastView !== APP_CONFIG.DEFAULT_VALUES.OVERVIEW_VIEW &&
          initialMeetings.some((m) => m.id === lastView)
        ) {
          setSelectedMeetingId(lastView);
        } else if (
          lastView !== APP_CONFIG.DEFAULT_VALUES.OVERVIEW_VIEW &&
          initialMeetings.length > 0
        ) {
          setSelectedMeetingId(initialMeetings[0].id);
        }
      } catch {
        // Failed to parse saved meetings - using defaults
      }
    }

    // If no saved data exists, use defaults
    if (!saved) {
      initialSeriesTitle = APP_CONFIG.DEFAULT_VALUES.SERIES_TITLE as string;
      initialSeriesAgenda = APP_CONFIG.DEFAULT_VALUES.SERIES_AGENDA as string;
    }

    // Initialize the update queue with loaded meetings
    updateQueue.current = new MeetingUpdateQueue(
      APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
      initialMeetings,
    );

    setMeetings(initialMeetings);
    setSeriesTitle(initialSeriesTitle);
    setSeriesAgenda(initialSeriesAgenda);
    hasInitialized.current = true;
  }, []);

  // Cleanup queue on unmount
  useEffect(() => {
    return () => {
      if (updateQueue.current) {
        updateQueue.current.destroy();
      }
    };
  }, []);

  // Save last view
  useEffect(() => {
    if (!hasInitialized.current) return;
    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.LAST_VIEW,
      selectedMeetingId || APP_CONFIG.DEFAULT_VALUES.OVERVIEW_VIEW,
    );
  }, [selectedMeetingId]);

  /**
   * Updates a meeting with new data and triggers auto-save.
   *
   * IMPORTANT: This is the only function you should use to modify meeting data!
   * Direct state mutation will bypass auto-save and cause data loss.
   *
   * The update is applied immediately to in-memory state (for UI responsiveness),
   * then queued for localStorage persistence after a 500ms debounce delay.
   *
   * @param id - The meeting ID to update
   * @param updates - Partial meeting data to merge with existing data
   *
   * @example
   * // Add a new block to the meeting
   * updateMeeting(meetingId, {
   *   blocks: [...meeting.blocks, newBlock]
   * });
   *
   * // Update meeting title
   * updateMeeting(meetingId, {
   *   title: "New Meeting Title"
   * });
   */
  const updateMeeting = (id: string, updates: MeetingUpdateData) => {
    if (!updateQueue.current) return;

    // Find the current meeting and apply updates
    const currentMeeting = updateQueue.current.getMeeting(id);
    if (!currentMeeting) return;

    const updatedMeeting = updateMeetingTimestamp({
      ...currentMeeting,
      ...updates,
    });

    // Throttled memory usage check to avoid performance overhead
    const now = Date.now();
    if (now - lastMemoryCheck.current > MEMORY_CHECK_THROTTLE) {
      const memCheck = checkMemoryUsage(updatedMeeting);
      if (memCheck.warning) {
        console.warn(
          `Large meeting data detected: ${
            (memCheck.size / 1024 / 1024).toFixed(2)
          }MB for meeting "${updatedMeeting.title}"`,
        );
      }
      lastMemoryCheck.current = now;
    }

    // Queue the update - this will update in-memory state immediately and schedule persistence
    updateQueue.current.queueUpdate(id, updatedMeeting);

    // Update React state to trigger re-renders
    setMeetings(updateQueue.current.getMeetings());

    // Also trigger series data save (since meetings changed)
    saveSeriesDataToStorage();
  };

  /**
   * Updates series title and/or agenda with auto-save.
   *
   * Uses the same debouncing pattern as meeting updates to prevent excessive localStorage writes.
   *
   * @param updates - Partial series data to update (title and/or agenda)
   */
  const updateSeries = (updates: { title?: string; agenda?: string }) => {
    if (!updateQueue.current || !hasInitialized.current) return;

    // Calculate the new values we'll use for both state and storage
    const newTitle = updates.title !== undefined ? updates.title : seriesTitle;
    const newAgenda = updates.agenda !== undefined
      ? updates.agenda
      : seriesAgenda;

    // Update React state immediately for UI responsiveness
    if (updates.title !== undefined) {
      setSeriesTitle(newTitle);
    }
    if (updates.agenda !== undefined) {
      setSeriesAgenda(newAgenda);
    }

    // Clear existing timeout if any
    if (seriesUpdateTimeout.current) {
      clearTimeout(seriesUpdateTimeout.current);
    }

    // Debounce the localStorage save
    seriesUpdateTimeout.current = setTimeout(() => {
      saveSeriesDataToStorage(newTitle, newAgenda);
      seriesUpdateTimeout.current = null;
    }, APP_CONFIG.AUTO_SAVE_DELAY);
  };

  /**
   * Initializes the series with localized default values if no series exists yet.
   * Should be called from the component level where translations are available.
   *
   * @param defaultTitle - Localized default title for new series
   */
  const initializeSeriesWithLocalization = (defaultTitle: string) => {
    if (!hasInitialized.current) return;

    // Only update if we're still using the hardcoded default AND no data exists in localStorage
    const hasExistingData = localStorage.getItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
    );
    if (
      !hasExistingData && seriesTitle === APP_CONFIG.DEFAULT_VALUES.SERIES_TITLE
    ) {
      setSeriesTitle(defaultTitle);
      // Don't auto-save this change since it's just a localization update
    }
  };

  const addMeeting = (title?: string) => {
    if (!updateQueue.current) return;

    const newMeeting = createEmptyMeeting(generateUUID(), title);

    // Queue the addition
    updateQueue.current.queueAdd(newMeeting);

    // Update React state to trigger re-renders
    setMeetings(updateQueue.current.getMeetings());
    setSelectedMeetingId(newMeeting.id);

    // Also trigger series data save (since meetings changed)
    saveSeriesDataToStorage();

    return newMeeting;
  };

  const deleteMeeting = (id: string) => {
    if (!updateQueue.current) return;

    // Queue the removal
    updateQueue.current.queueRemove(id);

    // Update React state to trigger re-renders
    setMeetings(updateQueue.current.getMeetings());

    if (selectedMeetingId === id) {
      setSelectedMeetingId(null);
    }

    // Also trigger series data save (since meetings changed)
    saveSeriesDataToStorage();
  };

  const importMeetings = (newMeetings: Meeting[]) => {
    if (!updateQueue.current) return;

    // Check total memory usage for imported meetings
    const totalMemCheck = checkMemoryUsage(newMeetings);
    if (totalMemCheck.warning) {
      console.warn(
        `Large import detected: ${
          (totalMemCheck.size / 1024 / 1024).toFixed(2)
        }MB total. Consider breaking into smaller imports.`,
      );
    }

    // Set meetings in queue (this forces immediate save for import operations)
    updateQueue.current.setMeetings(newMeetings);

    // Update React state to trigger re-renders
    setMeetings(updateQueue.current.getMeetings());
    setSelectedMeetingId(null); // Reset to overview

    // Also trigger series data save (since meetings changed)
    saveSeriesDataToStorage();
  };

  const clearAllData = () => {
    // Temporarily disable auto-save to prevent lastView from being re-saved
    hasInitialized.current = false;

    // Clear the update queue and all localStorage data
    if (updateQueue.current) {
      updateQueue.current.clearAll();
    }

    // Clear remaining localStorage data
    localStorage.removeItem(APP_CONFIG.LOCAL_STORAGE_KEYS.LAST_VIEW);
    localStorage.removeItem(APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES);
    localStorage.removeItem(APP_CONFIG.LOCAL_STORAGE_KEYS.LANGUAGE);
    localStorage.removeItem(APP_CONFIG.LOCAL_STORAGE_KEYS.FILTER_PREFERENCES);

    // Reset state
    setMeetings([]);
    setSelectedMeetingId(null);
    setSeriesTitle(APP_CONFIG.DEFAULT_VALUES.SERIES_TITLE as string);
    setSeriesAgenda(APP_CONFIG.DEFAULT_VALUES.SERIES_AGENDA as string);

    // Clear series update timeout if any
    if (seriesUpdateTimeout.current) {
      clearTimeout(seriesUpdateTimeout.current);
      seriesUpdateTimeout.current = null;
    }

    // Re-enable auto-save for future operations
    setTimeout(() => {
      hasInitialized.current = true;
    }, 0);

    // Note: Language will reset to browser default on next page load
    // Note: Attendees will be empty when useGlobalAttendees reloads
  };

  // Topic Groups operations
  const createTopicGroup = (
    meetingId: string,
    name: string,
    color?: string,
  ) => {
    const now = new Date().toISOString();
    const meeting = meetings.find((m) => m.id === meetingId);
    
    // Calculate next order value - use max existing order + 1, or Date.now() if no groups exist
    let nextOrder = Date.now();
    if (meeting && meeting.topicGroups && meeting.topicGroups.length > 0) {
      const maxOrder = Math.max(...meeting.topicGroups.map((tg) => tg.order));
      nextOrder = maxOrder + 1;
    }

    const newTopicGroup: TopicGroup = {
      id: generateUUID(),
      name,
      color,
      order: nextOrder,
      meetingId,
      createdAt: now,
      updatedAt: now,
    };

    if (meeting) {
      const updatedTopicGroups = [
        ...(meeting.topicGroups || []),
        newTopicGroup,
      ];
      updateMeeting(meetingId, { topicGroups: updatedTopicGroups });
    }

    return newTopicGroup;
  };

  const updateTopicGroup = (
    topicGroup: TopicGroup,
    updates: Partial<TopicGroup>,
  ) => {
    const updatedTopicGroup = {
      ...topicGroup,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const meeting = meetings.find((m) => m.id === topicGroup.meetingId);
    if (meeting) {
      const updatedTopicGroups = (meeting.topicGroups || []).map((tg) =>
        tg.id === topicGroup.id ? updatedTopicGroup : tg
      );
      updateMeeting(meeting.id, { topicGroups: updatedTopicGroups });
    }

    return updatedTopicGroup;
  };

  const deleteTopicGroup = (meetingId: string, topicGroupId: string) => {
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting) return;

    const updatedTopicGroups = (meeting.topicGroups || [])
      .filter((tg) => tg.id !== topicGroupId);

    // Remove topicGroupId from blocks that were in this group
    const updatedBlocks = meeting.blocks.map((block) =>
      block.topicGroupId === topicGroupId
        ? { ...block, topicGroupId: undefined }
        : block
    );

    updateMeeting(meetingId, {
      topicGroups: updatedTopicGroups,
      blocks: updatedBlocks,
    });
  };

  const swapTopicGroups = (
    meetingId: string,
    topicGroupId: string,
    direction: "left" | "right",
  ) => {
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting || !meeting.topicGroups) return;

    // Sort by order to get current positions
    const sortedGroups = [...meeting.topicGroups].sort((a, b) => a.order - b.order);

    const currentIndex = sortedGroups.findIndex((tg) => tg.id === topicGroupId);
    if (currentIndex === -1) return;

    // Check bounds
    if (direction === "left" && currentIndex === 0) return;
    if (direction === "right" && currentIndex === sortedGroups.length - 1) return;

    // Calculate swap target
    const swapIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;

    // Create updated groups with swapped order values
    const updatedGroups = meeting.topicGroups.map((tg) => {
      if (tg.id === sortedGroups[currentIndex].id) {
        return {
          ...tg,
          order: sortedGroups[swapIndex].order,
          updatedAt: new Date().toISOString(),
        };
      } else if (tg.id === sortedGroups[swapIndex].id) {
        return {
          ...tg,
          order: sortedGroups[currentIndex].order,
          updatedAt: new Date().toISOString(),
        };
      }
      return tg;
    });

    updateMeeting(meetingId, { topicGroups: updatedGroups });
  };

  const moveBlockToTopic = (
    meetingId: string,
    blockIndex: number,
    topicGroupId: string | undefined,
  ) => {
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting) return;

    const updatedBlocks = [...meeting.blocks];
    const normalizedTopicId = normalizeTopicGroupId(topicGroupId);
    updatedBlocks[blockIndex] = {
      ...updatedBlocks[blockIndex],
      topicGroupId: normalizedTopicId,
    };

    updateMeeting(meetingId, { blocks: updatedBlocks });
  };

  // Attendee management operations
  const removeAttendeeFromAllMeetings = (attendeeId: string) => {
    if (!updateQueue.current) return;

    // Update all meetings that contain this attendee
    const allMeetings = updateQueue.current.getMeetings();
    allMeetings.forEach((meeting) => {
      if (meeting.attendeeIds.includes(attendeeId)) {
        const updatedMeeting = {
          ...meeting,
          attendeeIds: meeting.attendeeIds.filter((id) => id !== attendeeId),
          updated_at: new Date().toISOString(),
        };
        updateQueue.current!.queueUpdate(meeting.id, updatedMeeting);
      }
    });

    // Update React state to trigger re-renders
    setMeetings(updateQueue.current.getMeetings());
  };

  // Count how many meetings contain a specific attendee
  const countMeetingsWithAttendee = (attendeeId: string): number => {
    return meetings.filter((meeting) =>
      meeting.attendeeIds.includes(attendeeId)
    ).length;
  };

  const selectedMeeting = selectedMeetingId
    ? meetings.find((m) => m.id === selectedMeetingId)
    : null;

  // Expose flush functionality for exports
  const flushPendingUpdates = async () => {
    if (updateQueue.current) {
      await updateQueue.current.flushAll();
    }
  };

  const flushMeetingUpdates = async (meetingId: string) => {
    if (updateQueue.current) {
      await updateQueue.current.flushMeeting(meetingId);
    }
  };

  return {
    meetings,
    selectedMeeting,
    selectedMeetingId,
    setSelectedMeetingId,
    updateMeeting,
    addMeeting,
    deleteMeeting,
    importMeetings,
    clearAllData,
    // Series management
    seriesTitle,
    seriesAgenda,
    updateSeries,
    initializeSeriesWithLocalization,
    // Topic Groups operations
    createTopicGroup,
    updateTopicGroup,
    deleteTopicGroup,
    swapTopicGroups,
    moveBlockToTopic,
    // Attendee management operations
    removeAttendeeFromAllMeetings,
    countMeetingsWithAttendee,
    // Update queue management
    flushPendingUpdates,
    flushMeetingUpdates,
  };
}
