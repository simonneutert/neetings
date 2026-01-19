import { useCallback, useEffect, useState } from "preact/hooks";
import { Attendee, createAttendee } from "../types/Attendee";
import { APP_CONFIG } from "../constants/index";

const STORAGE_KEY = APP_CONFIG.LOCAL_STORAGE_KEYS.ATTENDEES;

interface UseGlobalAttendeesResult {
  attendees: Attendee[];
  loading: boolean;
  error: string | null;
  addAttendee: (name: string, email: string) => Attendee;
  updateAttendee: (id: string, updates: Partial<Attendee>) => void;
  deleteAttendee: (id: string) => void;
  getAttendeeById: (id: string) => Attendee | undefined;
  getAttendeesByIds: (ids: string[]) => Attendee[];
  searchAttendees: (query: string) => Attendee[];
  refreshAttendees: () => void;
}

export function useGlobalAttendees(): UseGlobalAttendeesResult {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load attendees from localStorage
  const loadAttendees = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setAttendees(Array.isArray(parsed) ? parsed : []);
      } else {
        setAttendees([]);
      }
    } catch (err) {
      console.error("Failed to load attendees:", err);
      setError("Failed to load attendees");
      setAttendees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save attendees to localStorage
  const saveAttendees = useCallback((newAttendees: Attendee[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAttendees));
      setAttendees(newAttendees);
      setError(null);
    } catch (err) {
      console.error("Failed to save attendees:", err);
      setError("Failed to save attendees");
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadAttendees();
  }, [loadAttendees]);

  // Add new attendee
  const addAttendee = useCallback((name: string, email: string): Attendee => {
    const newAttendee = createAttendee(name, email);
    const updatedAttendees = [...attendees, newAttendee];
    saveAttendees(updatedAttendees);
    return newAttendee;
  }, [attendees, saveAttendees]);

  // Update existing attendee
  const updateAttendee = useCallback(
    (id: string, updates: Partial<Attendee>) => {
      const updatedAttendees = attendees.map((attendee) =>
        attendee.id === id
          ? { ...attendee, ...updates, updated_at: new Date().toISOString() }
          : attendee
      );
      saveAttendees(updatedAttendees);
    },
    [attendees, saveAttendees],
  );

  // Delete attendee
  const deleteAttendee = useCallback((id: string) => {
    const updatedAttendees = attendees.filter((attendee) => attendee.id !== id);
    saveAttendees(updatedAttendees);
  }, [attendees, saveAttendees]);

  // Get attendee by ID
  const getAttendeeById = useCallback((id: string): Attendee | undefined => {
    return attendees.find((attendee) => attendee.id === id);
  }, [attendees]);

  // Get multiple attendees by IDs
  const getAttendeesByIds = useCallback((ids: string[]): Attendee[] => {
    return attendees.filter((attendee) => ids.includes(attendee.id));
  }, [attendees]);

  // Search attendees by name or email
  const searchAttendees = useCallback((query: string): Attendee[] => {
    if (!query.trim()) return attendees;

    const searchTerm = query.toLowerCase();
    return attendees.filter((attendee) =>
      attendee.name.toLowerCase().includes(searchTerm) ||
      (attendee.email && attendee.email.toLowerCase().includes(searchTerm))
    );
  }, [attendees]);

  // Refresh attendees (reload from localStorage)
  const refreshAttendees = useCallback(() => {
    loadAttendees();
  }, [loadAttendees]);

  return {
    attendees,
    loading,
    error,
    addAttendee,
    updateAttendee,
    deleteAttendee,
    getAttendeeById,
    getAttendeesByIds,
    searchAttendees,
    refreshAttendees,
  };
}
