import { FunctionalComponent } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Meeting } from "../types/Meeting";
import { AttendeeAutocomplete } from "./AttendeeAutocomplete";
import { useTranslation } from "../i18n";
import { useGlobalAttendees } from "../hooks/useGlobalAttendees";
import { APP_CONFIG } from "../constants/index";

interface MeetingAttendeesProps {
  meeting: Meeting;
  onUpdateMeeting: (updates: Partial<Meeting>) => void;
}

export const MeetingAttendees: FunctionalComponent<MeetingAttendeesProps> = ({
  meeting,
  onUpdateMeeting,
}) => {
  const { t } = useTranslation();
  const {
    attendees: globalAttendees,
    loading,
    error,
    addAttendee,
    getAttendeesByIds,
  } = useGlobalAttendees();
  const [allMeetings, setAllMeetings] = useState<any[]>([]);

  // Load meetings from localStorage (attendees now handled by useGlobalAttendees)
  useEffect(() => {
    try {
      const storedMeetings = localStorage.getItem(
        APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
      );
      if (storedMeetings) {
        setAllMeetings(JSON.parse(storedMeetings));
      }
    } catch (error) {
      console.error("Failed to load meetings:", error);
    }
  }, []);

  const meetingAttendeeIds = meeting.attendeeIds || [];
  const meetingAttendees = getAttendeesByIds(meetingAttendeeIds);
  const availableAttendees = globalAttendees.filter((attendee) =>
    !meetingAttendeeIds.includes(attendee.id)
  );

  const handleAddAttendee = (attendeeId: string) => {
    const updatedAttendeeIds = [...meetingAttendeeIds, attendeeId];
    onUpdateMeeting({ attendeeIds: updatedAttendeeIds });
  };

  const handleRemoveAttendee = (attendeeId: string) => {
    const updatedAttendeeIds = meetingAttendeeIds.filter((id) =>
      id !== attendeeId
    );
    onUpdateMeeting({ attendeeIds: updatedAttendeeIds });
  };

  const handleCreateNewAttendee = (name: string, email: string) => {
    // Check for duplicate email (only if email is provided)
    if (email && globalAttendees.some((a) => a.email === email)) {
      alert(t("attendees.duplicateEmail"));
      return;
    }

    // Create new attendee and add to global registry
    const newAttendee = addAttendee(name, email || "");

    // Add to current meeting
    handleAddAttendee(newAttendee.id);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Handle loading and error states
  if (loading) {
    return (
      <div className="card mb-4">
        <div className="card-body text-center">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">{t("common.loading")}</span>
          </div>
          <span className="ms-2">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card mb-4">
        <div className="card-body">
          <div className="alert alert-danger" role="alert">
            {t("attendees.loadingError")}: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-3">
          {t("attendees.title", { count: meetingAttendees.length })}
        </h5>

        {/* Autocomplete Input */}
        <AttendeeAutocomplete
          availableAttendees={availableAttendees}
          onAddAttendee={handleAddAttendee}
          onCreateNew={handleCreateNewAttendee}
          placeholder={t("attendees.addPlaceholder")}
          meetings={allMeetings}
        />
      </div>

      <div className="card-body">
        {/* Removed old dropdown section */}

        {/* Current Meeting Attendees */}
        {meetingAttendees.length === 0
          ? (
            <p className="text-muted mb-0">
              {t("attendees.noAttendees")}
            </p>
          )
          : (
            <div className="list-group">
              {meetingAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div className="d-flex align-items-center">
                    {/* Avatar */}
                    <div
                      className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: "40px",
                        height: "40px",
                        fontSize: "14px",
                        fontWeight: "bold",
                      }}
                    >
                      {getInitials(attendee.name)}
                    </div>

                    {/* Name and Email */}
                    <div>
                      <strong>{attendee.name}</strong>
                      <br />
                      {attendee.email && (
                        <span className="text-muted">{attendee.email}</span>
                      )}
                    </div>
                  </div>

                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleRemoveAttendee(attendee.id)}
                    title={t("attendees.removeTooltip")}
                  >
                    {t("attendees.remove")}
                  </button>
                </div>
              ))}
            </div>
          )}

        {/* Quick Stats */}
        {globalAttendees.length > 0 && (
          <div className="mt-3 text-muted">
            <small>
              {t("attendees.totalStats", {
                current: meetingAttendees.length,
                total: globalAttendees.length,
              })}
            </small>
          </div>
        )}
      </div>
    </div>
  );
};
