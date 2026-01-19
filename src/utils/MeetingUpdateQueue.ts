import { Meeting } from "../types/Meeting";
import { APP_CONFIG } from "../constants";

/**
 * Meeting-specific update queue that handles localStorage persistence
 * with per-meeting debouncing to prevent race conditions and improve performance
 */
export class MeetingUpdateQueue {
  private queue = new Map<string, NodeJS.Timeout>();
  private meetings: Meeting[] = [];
  private storageKey: string;

  constructor(storageKey: string, initialMeetings: Meeting[] = []) {
    this.storageKey = storageKey;
    this.meetings = [...initialMeetings];
  }

  /**
   * Queue an update for a specific meeting
   * Replaces any existing queued update for the same meeting
   */
  queueUpdate(meetingId: string, updatedMeeting: Meeting): void {
    // Update in-memory state immediately for UI consistency
    this.updateMeetingInMemory(meetingId, updatedMeeting);

    // Cancel existing save task for this meeting if it exists
    if (this.queue.has(meetingId)) {
      clearTimeout(this.queue.get(meetingId)!);
    }

    // Queue new save task with debounce delay
    const taskId = setTimeout(() => {
      this.saveMeetingsToStorage();
      this.queue.delete(meetingId);
    }, APP_CONFIG.AUTO_SAVE_DELAY);

    this.queue.set(meetingId, taskId);
  }

  /**
   * Add a new meeting to the queue
   */
  queueAdd(newMeeting: Meeting): void {
    // Add to in-memory state immediately
    this.meetings = [...this.meetings, newMeeting];

    // Queue save for the new meeting
    this.queueUpdate(newMeeting.id, newMeeting);
  }

  /**
   * Queue removal of a meeting
   */
  queueRemove(meetingId: string): void {
    // Remove from in-memory state immediately
    this.meetings = this.meetings.filter((m) => m.id !== meetingId);

    // Cancel any pending update for this meeting
    if (this.queue.has(meetingId)) {
      clearTimeout(this.queue.get(meetingId)!);
      this.queue.delete(meetingId);
    }

    // Queue save to persist the removal
    const taskId = setTimeout(() => {
      this.saveMeetingsToStorage();
    }, APP_CONFIG.AUTO_SAVE_DELAY);

    // Use a special key for removal operations
    this.queue.set(`__remove_${meetingId}`, taskId);
  }

  /**
   * Flush all pending updates immediately
   * Useful before exports or critical operations
   */
  async flushAll(): Promise<void> {
    // Cancel all pending timers
    for (const [_meetingId, timerId] of this.queue) {
      clearTimeout(timerId);
    }

    // Clear the queue
    this.queue.clear();

    // Save immediately
    this.saveMeetingsToStorage();
  }

  /**
   * Flush updates for a specific meeting
   */
  async flushMeeting(meetingId: string): Promise<void> {
    if (this.queue.has(meetingId)) {
      clearTimeout(this.queue.get(meetingId)!);
      this.queue.delete(meetingId);
      this.saveMeetingsToStorage();
    }
  }

  /**
   * Get current in-memory meetings state
   */
  getMeetings(): Meeting[] {
    return [...this.meetings];
  }

  /**
   * Get a specific meeting from in-memory state
   */
  getMeeting(meetingId: string): Meeting | undefined {
    return this.meetings.find((m) => m.id === meetingId);
  }

  /**
   * Update meetings array (for operations like import)
   */
  setMeetings(meetings: Meeting[]): void {
    this.meetings = [...meetings];
    // Force immediate save for import operations
    this.saveMeetingsToStorage();
  }

  /**
   * Check if there are any pending updates
   */
  hasPendingUpdates(): boolean {
    return this.queue.size > 0;
  }

  /**
   * Get list of meeting IDs with pending updates
   */
  getPendingMeetingIds(): string[] {
    return Array.from(this.queue.keys()).filter((key) =>
      !key.startsWith("__remove_")
    );
  }

  /**
   * Clear all data and queue
   */
  clearAll(): void {
    // Cancel all pending timers
    for (const timerId of this.queue.values()) {
      clearTimeout(timerId);
    }

    // Clear queue and meetings
    this.queue.clear();
    this.meetings = [];

    // Remove from localStorage
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Update a meeting in the in-memory array
   */
  private updateMeetingInMemory(
    meetingId: string,
    updatedMeeting: Meeting,
  ): void {
    const index = this.meetings.findIndex((m) => m.id === meetingId);

    if (index !== -1) {
      // Update existing meeting
      this.meetings = [
        ...this.meetings.slice(0, index),
        updatedMeeting,
        ...this.meetings.slice(index + 1),
      ];
    } else {
      // Add new meeting if not found
      this.meetings = [...this.meetings, updatedMeeting];
    }
  }

  /**
   * Save the current meetings array to localStorage
   */
  private saveMeetingsToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.meetings));
    } catch (error) {
      console.error("Failed to save meetings to localStorage:", error);
      // Could implement retry logic or error callbacks here
    }
  }

  /**
   * Cleanup method to be called when the queue is no longer needed
   */
  destroy(): void {
    // Cancel all pending timers
    for (const timerId of this.queue.values()) {
      clearTimeout(timerId);
    }
    this.queue.clear();
  }
}
