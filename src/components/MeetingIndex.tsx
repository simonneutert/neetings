import { FunctionalComponent } from "preact";
import { useTranslation } from "../i18n/index";

interface MeetingIndexProps {
  meetings: any[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (meeting: any) => void;
  children?: preact.ComponentChildren;
}

export const MeetingIndex: FunctionalComponent<MeetingIndexProps> = (
  { meetings, onSelect, onDelete, onExport, children },
) => {
  const { t } = useTranslation();

  return (
    <div class="my-4">
      {children}

      {meetings.length === 0
        ? (
          <p class="text-muted text-center fst-italic">
            {t("meetingIndex.noMeetings")}
          </p>
        )
        : (
          <ul
            className="list-group"
            style={{ maxWidth: 500, margin: "0 auto" }}
          >
            {meetings.map((meeting) => {
              const isEmpty = meeting.blocks.length === 0;
              return (
                <li
                  key={meeting.id}
                  className={`list-group-item d-flex justify-content-between align-items-center ${
                    isEmpty ? "bg-body-secondary" : "bg-body"
                  } border rounded shadow-sm mb-2`}
                  style={{
                    cursor: "pointer",
                    borderWidth: "2px",
                    borderStyle: isEmpty ? "dashed" : "solid",
                    borderColor: isEmpty
                      ? "var(--bs-border-color)"
                      : "rgb(249, 121, 194)",
                    transition: "all 0.15s ease",
                    transform: "translateY(0)",
                  }}
                  onClick={() => onSelect(meeting.id)}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.transform = "translateY(-2px)";
                    target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.transform = "translateY(0)";
                    target.style.boxShadow = "";
                  }}
                >
                  <div>
                    {meeting.date ? `${meeting.date}` : ""}
                    <br />
                    <strong>{meeting.title || t("meeting.untitled")}</strong>
                    <br />
                    <small className="text-muted">
                      {t("meeting.lastUpdate")}: {meeting.updated_at
                        ? new Date(meeting.updated_at).toLocaleString()
                        : "-"}
                    </small>
                  </div>
                  <div className="d-flex">
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      title={t("importExport.actions.exportMeeting")}
                      onClick={(e) => {
                        e.stopPropagation();
                        onExport(meeting);
                      }}
                    >
                      📄
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      title={t("meetingIndex.deleteMeetingTitle")}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            t("confirmations.deleteMeeting"),
                          )
                        ) {
                          onDelete(meeting.id);
                        }
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
    </div>
  );
};
