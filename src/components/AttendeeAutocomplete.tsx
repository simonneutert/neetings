import { FunctionalComponent } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { Attendee } from "../types/Attendee";
import { useTranslation } from "../i18n";

interface AttendeeAutocompleteProps {
  availableAttendees: Attendee[];
  onAddAttendee: (attendeeId: string) => void;
  onCreateNew: (name: string, email: string) => void;
  placeholder?: string;
  meetings?: any[]; // For calculating participation counts
}

export const AttendeeAutocomplete: FunctionalComponent<
  AttendeeAutocompleteProps
> = ({
  availableAttendees,
  onAddAttendee,
  onCreateNew,
  placeholder,
  meetings = [],
}) => {
  const { t } = useTranslation();
  const defaultPlaceholder = t("attendees.autocomplete.placeholder");
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Attendee[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (input.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = availableAttendees.filter((attendee) =>
      attendee.name.toLowerCase().includes(input.toLowerCase()) ||
      (attendee.email &&
        attendee.email.toLowerCase().includes(input.toLowerCase()))
    );

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0 || input.trim().length > 0);
    setSelectedIndex(-1);
  }, [input, availableAttendees]);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => prev < suggestions.length ? prev + 1 : prev);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => prev > -1 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        handleSelection();
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle selection (keyboard or mouse)
  const handleSelection = (index?: number) => {
    const selectedIdx = index !== undefined ? index : selectedIndex;

    if (selectedIdx >= 0 && selectedIdx < suggestions.length) {
      // Select existing attendee
      const attendee = suggestions[selectedIdx];
      onAddAttendee(attendee.id);
      resetInput();
    } else if (selectedIdx === suggestions.length && input.trim().length > 0) {
      // Create new attendee option
      const inputValue = input.trim();
      if (isValidEmail(inputValue)) {
        // If it's an email, extract name from email
        const name = inputValue.split("@")[0].replace(/[._-]/g, " ");
        onCreateNew(name, inputValue);
      } else {
        // If it's just a name, create attendee without email
        onCreateNew(inputValue, "");
      }
      resetInput();
    }
  };

  const resetInput = () => {
    setInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getMeetingCount = (attendeeId: string) => {
    return meetings.filter((meeting) =>
      meeting.attendeeIds && meeting.attendeeIds.includes(attendeeId)
    ).length;
  };

  return (
    <div className="position-relative">
      <div className="input-group">
        <input
          ref={inputRef}
          type="text"
          className="form-control"
          placeholder={placeholder || defaultPlaceholder}
          value={input}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
          onKeyDown={handleKeyDown}
          onFocus={() => input.length > 0 && setShowSuggestions(true)}
          onBlur={() => {
            // Delay hiding to allow click on suggestions
            setTimeout(() => setShowSuggestions(false), 150);
          }}
        />
        <button
          className="btn btn-outline-primary"
          type="button"
          onClick={() => handleSelection()}
          disabled={!input.trim()}
        >
          {t("attendees.autocomplete.addButton")}
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-sm"
          style={{ zIndex: 1000, maxHeight: "200px", overflowY: "auto" }}
        >
          {suggestions.map((attendee, index) => (
            <div
              key={attendee.id}
              className={`d-flex align-items-center p-2 border-bottom cursor-pointer ${
                index === selectedIndex
                  ? "bg-primary text-white"
                  : "hover-bg-light"
              }`}
              onClick={() => handleSelection(index)}
              style={{ cursor: "pointer" }}
            >
              {/* Avatar */}
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center me-2 ${
                  index === selectedIndex
                    ? "bg-white text-primary"
                    : "bg-secondary text-white"
                }`}
                style={{
                  width: "32px",
                  height: "32px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                {getInitials(attendee.name)}
              </div>

              {/* Name and Email */}
              <div className="flex-grow-1">
                <div className="fw-semibold">{attendee.name}</div>
                <small
                  className={index === selectedIndex
                    ? "text-white-50"
                    : "text-muted"}
                >
                  {attendee.email || t("attendees.noEmail")}
                  {meetings.length > 0 && (
                    <span className="ms-2">
                      • {t("attendees.autocomplete.meetingCount", {
                        count: getMeetingCount(attendee.id),
                      })}
                    </span>
                  )}
                </small>
              </div>
            </div>
          ))}

          {/* Create New Option */}
          {input.trim().length > 0 && suggestions.length === 0 && (
            <div
              className={`d-flex align-items-center p-2 cursor-pointer ${
                selectedIndex === suggestions.length
                  ? "bg-success text-white"
                  : "hover-bg-light"
              }`}
              onClick={() => handleSelection(suggestions.length)}
              style={{ cursor: "pointer" }}
            >
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center me-2 ${
                  selectedIndex === suggestions.length
                    ? "bg-white text-success"
                    : "bg-success text-white"
                }`}
                style={{ width: "32px", height: "32px", fontSize: "14px" }}
              >
                +
              </div>
              <div className="flex-grow-1">
                <div className="fw-semibold">
                  {t("attendees.autocomplete.createNew")}
                </div>
                <small
                  className={selectedIndex === suggestions.length
                    ? "text-white-50"
                    : "text-muted"}
                >
                  {isValidEmail(input)
                    ? input
                    : `${input} ${t("attendees.autocomplete.nameOnly")}`}
                </small>
              </div>
            </div>
          )}

          {/* No results */}
          {suggestions.length === 0 && input.trim().length === 0 && (
            <div className="p-3 text-muted text-center">
              <small>
                {t("attendees.autocomplete.searchPrompt")}
              </small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
