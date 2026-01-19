import { FunctionalComponent } from "preact";
import { useMemo, useState } from "preact/hooks";
import { Attendee } from "../types/Attendee";
import { useTranslation } from "../i18n";
import { useDebounceSearch } from "../hooks/useDebounceSearch";
import { useGlobalAttendees } from "../hooks/useGlobalAttendees";
import { useMeetingState } from "../hooks/useMeetingState";
import { ATTENDEE_SEARCH_CONFIG } from "../constants";

interface AttendeeManagerProps {
  onGoBack: () => void;
}

export const AttendeeManager: FunctionalComponent<AttendeeManagerProps> = ({
  onGoBack,
}) => {
  const { t } = useTranslation();
  const {
    attendees,
    loading,
    error,
    addAttendee,
    updateAttendee,
    deleteAttendee,
    searchAttendees,
  } = useGlobalAttendees();
  const {
    removeAttendeeFromAllMeetings,
    countMeetingsWithAttendee,
  } = useMeetingState();
  const [editingAttendee, setEditingAttendee] = useState<Attendee | null>(null);
  const [newAttendeeName, setNewAttendeeName] = useState("");
  const [newAttendeeEmail, setNewAttendeeEmail] = useState("");

  // Search functionality
  const {
    searchQuery,
    debouncedQuery,
    isSearching,
    setSearchQuery,
    clearSearch,
  } = useDebounceSearch({
    debounceDelay: ATTENDEE_SEARCH_CONFIG.DEBOUNCE_DELAY,
    minLength: ATTENDEE_SEARCH_CONFIG.MIN_LENGTH,
  });

  // Filtered attendees based on search
  const filteredAttendees = useMemo(() => {
    if (!debouncedQuery.trim()) return attendees;
    return searchAttendees(debouncedQuery);
  }, [attendees, debouncedQuery, searchAttendees]);

  // Highlight matching text in search results
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const isMatch = regex.test(part);
      regex.lastIndex = 0; // Reset regex for next test

      return isMatch
        ? (
          <mark
            key={i}
            style={{
              backgroundColor: "#fff3cd",
              borderRadius: "2px",
              padding: "0.1rem 0.2rem",
              fontWeight: "600",
              color: "#856404",
              border: "none",
            }}
          >
            {part}
          </mark>
        )
        : part;
    });
  };

  // Error handling
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {t("attendeeManager.loadingError")}: {error}
      </div>
    );
  }

  const handleAddAttendee = () => {
    if (!newAttendeeName.trim()) {
      alert(t("attendeeManager.validationError"));
      return;
    }

    // Check for duplicate email (only if email is provided)
    if (
      newAttendeeEmail.trim() &&
      attendees.some((a) => a.email === newAttendeeEmail.trim())
    ) {
      alert(t("attendeeManager.duplicateEmailError"));
      return;
    }

    addAttendee(newAttendeeName.trim(), newAttendeeEmail.trim() || "");
    setNewAttendeeName("");
    setNewAttendeeEmail("");
  };

  const handleUpdateAttendee = (
    attendee: Attendee,
    name: string,
    email: string,
  ) => {
    if (!name.trim()) {
      alert(t("attendeeManager.validationError"));
      return;
    }

    // Check for duplicate email (excluding current attendee, only if email is provided)
    if (
      email.trim() &&
      attendees.some((a) => a.id !== attendee.id && a.email === email.trim())
    ) {
      alert(t("attendeeManager.duplicateEmailError"));
      return;
    }

    updateAttendee(attendee.id, {
      name: name.trim(),
      email: email.trim() || undefined,
    });
    setEditingAttendee(null);
  };

  const handleDeleteAttendee = (attendeeId: string) => {
    const attendee = attendees.find((a) => a.id === attendeeId);
    if (!attendee) return;

    const meetingCount = countMeetingsWithAttendee(attendeeId);

    // Choose the appropriate confirmation message based on meeting count
    const confirmationKey = meetingCount > 0
      ? "deleteConfirmation"
      : "deleteConfirmationNoMeetings";
    const confirmationMessage = t(`attendeeManager.${confirmationKey}`, {
      name: attendee.name,
      meetingCount,
    });

    if (window.confirm(confirmationMessage)) {
      // Remove from meetings first
      removeAttendeeFromAllMeetings(attendeeId);

      // Then remove from global attendees
      deleteAttendee(attendeeId);

      // Show success message
      const successMessage = t("attendeeManager.deleteSuccess", {
        name: attendee.name,
      });

      // Use a non-blocking notification instead of alert
      console.log(successMessage); // For now, we'll log it
      // TODO: In the future, we could add a toast notification system
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">
            {t("common.loading")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: "2rem 0" }}>
      <button
        className="btn btn-link mb-3"
        onClick={onGoBack}
      >
        {t("common.backToMeetings")}
      </button>

      <h2>{t("attendeeManager.title")}</h2>
      <p className="text-muted">{t("attendeeManager.description")}</p>

      {/* Add New Attendee Form */}
      <div className="card mb-4">
        <div className="card-header">
          <h5>{t("attendeeManager.addNewTitle")}</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-5">
              <label className="form-label">
                {t("attendeeManager.nameLabel")}
              </label>
              <input
                type="text"
                className="form-control"
                value={newAttendeeName}
                onChange={(e) =>
                  setNewAttendeeName((e.target as HTMLInputElement).value)}
                placeholder={t("attendeeManager.namePlaceholder")}
              />
            </div>
            <div className="col-md-5">
              <label className="form-label">
                {t("attendeeManager.emailLabel")}
              </label>
              <input
                type="email"
                className="form-control"
                value={newAttendeeEmail}
                onChange={(e) =>
                  setNewAttendeeEmail((e.target as HTMLInputElement).value)}
                placeholder={t("attendeeManager.emailPlaceholder")}
              />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button
                className="btn btn-primary"
                onClick={handleAddAttendee}
                disabled={!newAttendeeName.trim()}
              >
                {t("attendeeManager.addButton")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      {attendees.length > 0 && (
        <div className="card mb-4">
          <div className="card-body">
            <h6 className="mb-3">
              🔍 {t("attendeeManager.searchPlaceholder").replace("...", "")}
            </h6>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <input
                type="text"
                placeholder={t("attendeeManager.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery((e.target as HTMLInputElement).value)}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  border: "1px solid #dee2e6",
                  borderRadius: "4px",
                  fontSize: "0.9rem",
                }}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #6c757d",
                    borderRadius: "4px",
                    backgroundColor: "white",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                  title={t("attendeeManager.clearSearch")}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search status indicators */}
            {isSearching && (
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "#6c757d",
                  marginTop: "0.5rem",
                }}
              >
                {t("common.searching")}
              </div>
            )}

            {debouncedQuery && !isSearching && (
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "#6c757d",
                  marginTop: "0.5rem",
                }}
              >
                {filteredAttendees.length > 0
                  ? (
                    t("attendeeManager.searchResults", {
                      count: filteredAttendees.length,
                      query: debouncedQuery,
                    })
                  )
                  : (
                    t("attendeeManager.noSearchResults", {
                      query: debouncedQuery,
                    })
                  )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attendees List */}
      {attendees.length === 0
        ? <p className="text-muted">{t("attendeeManager.noAttendeesYet")}</p>
        : (
          <div className="card">
            <div className="card-header">
              <h5>
                {debouncedQuery
                  ? (
                    filteredAttendees.length > 0
                      ? (
                        t("attendeeManager.searchResults", {
                          count: filteredAttendees.length,
                          query: debouncedQuery,
                        })
                      )
                      : (
                        t("attendeeManager.noSearchResults", {
                          query: debouncedQuery,
                        })
                      )
                  )
                  : (
                    t("attendeeManager.attendeesListTitle", {
                      count: attendees.length,
                    })
                  )}
              </h5>
            </div>
            <div className="card-body p-0">
              {filteredAttendees.length === 0 && debouncedQuery
                ? (
                  <div className="text-center p-4 text-muted">
                    <p>
                      {t("attendeeManager.noSearchResults", {
                        query: debouncedQuery,
                      })}
                    </p>
                  </div>
                )
                : (
                  <div className="list-group list-group-flush">
                    {filteredAttendees.map((attendee) => (
                      <div key={attendee.id} className="list-group-item">
                        {editingAttendee?.id === attendee.id
                          ? (
                            <EditAttendeeForm
                              attendee={attendee}
                              onSave={handleUpdateAttendee}
                              onCancel={() => setEditingAttendee(null)}
                            />
                          )
                          : (
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>
                                  {highlightMatch(
                                    attendee.name,
                                    debouncedQuery,
                                  )}
                                </strong>
                                <br />
                                {attendee.email && (
                                  <span className="text-muted">
                                    {highlightMatch(
                                      attendee.email,
                                      debouncedQuery,
                                    )}
                                  </span>
                                )}
                                <br />
                                <small className="text-muted">
                                  {t("attendeeManager.addedLabel")}{" "}
                                  {new Date(attendee.created_at)
                                    .toLocaleString()}
                                </small>
                              </div>
                              <div>
                                <button
                                  className="btn btn-sm btn-outline-primary me-2"
                                  onClick={() =>
                                    setEditingAttendee(attendee)}
                                >
                                  {t("attendeeManager.editButton")}
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() =>
                                    handleDeleteAttendee(attendee.id)}
                                >
                                  {t("attendeeManager.deleteButton")}
                                </button>
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}
    </div>
  );
};

// Separate component for editing attendee inline
const EditAttendeeForm: FunctionalComponent<{
  attendee: Attendee;
  onSave: (attendee: Attendee, name: string, email: string) => void;
  onCancel: () => void;
}> = ({ attendee, onSave, onCancel }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(attendee.name);
  const [email, setEmail] = useState(attendee.email || "");

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && name.trim()) {
      e.preventDefault();
      onSave(attendee, name, email);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div
      className="row g-3"
      style={{
        backgroundColor: "#f8f9fa",
        padding: "0.75rem",
        borderRadius: "4px",
      }}
    >
      <div className="col-md-4">
        <input
          type="text"
          className="form-control"
          value={name}
          onChange={(e) => setName((e.target as HTMLInputElement).value)}
          onKeyDown={handleKeyDown}
          placeholder={t("attendeeManager.editNamePlaceholder")}
          autoFocus
          style={{ borderColor: name.trim() ? "#28a745" : "#dc3545" }}
        />
      </div>
      <div className="col-md-4">
        <input
          type="email"
          className="form-control"
          value={email}
          onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
          onKeyDown={handleKeyDown}
          placeholder={t("attendeeManager.editEmailPlaceholder")}
          style={{ borderColor: "#ced4da" }}
        />
      </div>
      <div className="col-md-4">
        <button
          className="btn btn-sm btn-success me-2"
          onClick={() => onSave(attendee, name, email)}
          disabled={!name.trim()}
          title={`${t("common.save")} (Enter)`}
        >
          {t("common.save")}
        </button>
        <button
          className="btn btn-sm btn-secondary"
          onClick={onCancel}
          title={`${t("common.cancel")} (Esc)`}
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
};
