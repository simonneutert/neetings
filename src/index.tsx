import { render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { Navigation } from "./components/Navigation";
import { MeetingsImportExport } from "./components/MeetingsImportExport";
import { MeetingIndex } from "./components/MeetingIndex";
import { AttendeeManager } from "./components/AttendeeManager";
import { FAQ } from "./components/FAQ";
import { Hero } from "./components/Hero";
import { BrandTitle } from "./components/BrandTitle";
import { TermsOfService } from "./components/TermsOfService";
import { Imprint } from "./components/Imprint";
import { MeetingAttendees } from "./components/MeetingAttendees";
import { ExportModal } from "./components/ExportModal";
import { UnifiedFilter } from "./components/UnifiedFilter";
import { KanbanBoard } from "./components/KanbanBoard";
import { Footer } from "./components/Footer";
import { LoadingScreen } from "./components/LoadingScreen";
import { useMeetingState } from "./hooks/useMeetingState";
import "./styles/kanban-mobile.css";
import { Block, toggleBlockCompletion } from "./types/Block";
import { APP_CONFIG, CONFIRM_MESSAGES } from "./constants/index";
import { I18nProvider, useTranslation } from "./i18n/index";
import { EnhancedDownloadButton } from "./components/EnhancedDownloadButton";
import { EnhancedFilterButton } from "./components/EnhancedFilterButton";
import { useTheme } from "./hooks/useTheme";
import { Meeting } from "./types/Meeting";

function AppContent() {
  const { t } = useTranslation();
  useTheme(); // Initialize theme system
  const {
    meetings,
    selectedMeeting,
    selectedMeetingId,
    setSelectedMeetingId,
    updateMeeting,
    addMeeting,
    deleteMeeting,
    importMeetings,
    clearAllData,
    createTopicGroup,
    updateTopicGroup,
    deleteTopicGroup,
    swapTopicGroups,
    moveBlockToTopic,
    flushPendingUpdates,
    // Series management
    seriesTitle,
    seriesAgenda,
    updateSeries,
    initializeSeriesWithLocalization,
  } = useMeetingState();

  const [newlyCreatedBlockId, setNewlyCreatedBlockId] = useState<
    string | null
  >(
    null,
  );
  const [newlyCreatedMeetingId, setNewlyCreatedMeetingId] = useState<
    string | null
  >(
    null,
  );
  const [showAttendeeManager, setShowAttendeeManager] = useState<boolean>(
    false,
  );
  const [showFAQ, setShowFAQ] = useState<boolean>(false);
  const [showTerms, setShowTerms] = useState<boolean>(false);
  const [showImprint, setShowImprint] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportMeeting, setExportMeeting] = useState<Meeting | null>(null);
  const [showMeetingFilter, setShowMeetingFilter] = useState<boolean>(false);
  const [showOverviewFilter, setShowOverviewFilter] = useState<boolean>(false);

  // Ref for the meeting title input to enable auto-focus
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Export handler for meetings list
  const handleExportMeeting = (meeting: Meeting) => {
    setExportMeeting(meeting);
    setShowExportModal(true);
  };

  // Close export modal handler
  const handleCloseExportModal = () => {
    setShowExportModal(false);
    setExportMeeting(null);
  };

  // Auto-focus the title input when a new meeting is created
  useEffect(() => {
    if (
      selectedMeeting && selectedMeeting.id === newlyCreatedMeetingId &&
      titleInputRef.current &&
      !newlyCreatedBlockId // Don't auto-focus title if a block is being created
    ) {
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        if (
          titleInputRef.current &&
          titleInputRef.current.value === selectedMeeting.title &&
          !newlyCreatedBlockId && // Double-check that no block is being created
          document.activeElement !== titleInputRef.current && // Don't interfere if already focused
          !document.activeElement?.matches("input, textarea") // Don't steal focus from other inputs
        ) {
          // Only focus and select if the input still contains the default meeting title
          // This prevents interference with user input
          titleInputRef.current.focus();
          titleInputRef.current.select();
        }
      });

      // Clear the flag immediately after focusing to prevent interference with block auto-focus
      setNewlyCreatedMeetingId(null);
    }
  }, [selectedMeeting, newlyCreatedMeetingId, newlyCreatedBlockId]);

  // Initialize series with localized default title
  useEffect(() => {
    initializeSeriesWithLocalization(t("meeting.series.defaultTitle"));
  }, [initializeSeriesWithLocalization, t]);

  const handleUpdateMeetingField = (field: string, value: string) => {
    if (!selectedMeetingId) return;
    updateMeeting(selectedMeetingId, { [field]: value });
  };

  const handleUpdateBlock = (index: number, updatedBlock: Block) => {
    if (!selectedMeeting) return;
    // Replace block by id, and filter out any accidental duplicates
    const updatedBlocks = selectedMeeting.blocks
      .map((
        block,
        _i,
      ) => (block.id === updatedBlock.id ? updatedBlock : block))
      .filter((block, i, arr) => arr.findIndex((b) => b.id === block.id) === i);
    updateMeeting(selectedMeetingId!, { blocks: updatedBlocks });
  };

  // Handler for KanbanBoard which expects a complete Block
  const handleAddBlock = (block: Block) => {
    if (!selectedMeeting) return;
    const updatedBlocks = [...selectedMeeting.blocks, block];
    updateMeeting(selectedMeetingId!, { blocks: updatedBlocks });

    // Track the newly created block for auto-focus
    setNewlyCreatedBlockId(block.id || null);

    // Clear the focus flag after a brief delay to allow re-focusing on subsequent additions
    setTimeout(() => {
      setNewlyCreatedBlockId(null);
    }, APP_CONFIG.FOCUS_CLEAR_DELAY);
  };

  const handleDeleteBlock = (index: number) => {
    if (!selectedMeeting) return;
    const blocks = selectedMeeting.blocks.filter((_, i) => i !== index);
    updateMeeting(selectedMeetingId!, { blocks });
  };

  const handleClearMeeting = () => {
    if (
      !selectedMeetingId ||
      !window.confirm(CONFIRM_MESSAGES.CLEAR_MEETING)
    ) return;
    deleteMeeting(selectedMeetingId);
  };

  const handleNavigateToMeeting = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
  };

  const handleToggleTodoCompletion = (meetingId: string, blockId: string) => {
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting) return;

    const updatedBlocks = meeting.blocks.map((block) => {
      if (block.id === blockId && block.type === "todoblock") {
        return toggleBlockCompletion(block);
      }
      return block;
    });

    updateMeeting(meetingId, { blocks: updatedBlocks });
  };

  const handleClearAllData = () => {
    clearAllData();
  };

  const handleAddMeeting = () => {
    const newMeeting = addMeeting(t("meeting.untitled"));

    // Track the newly created meeting for auto-focus on title input
    setNewlyCreatedMeetingId(newMeeting.id);
  };

  return (
    <>
      <Navigation
        onClearMeeting={handleClearMeeting}
        onGoToIndex={() => {
          setSelectedMeetingId(null);
          setShowAttendeeManager(false);
          setShowFAQ(false);
          setShowTerms(false);
          setShowImprint(false);
        }}
        onClearAllData={handleClearAllData}
        hasMeetingSelected={!!selectedMeeting}
        onGoToAttendees={() => {
          setSelectedMeetingId(null);
          setShowAttendeeManager(true);
          setShowFAQ(false);
          setShowTerms(false);
          setShowImprint(false);
        }}
        onGoToFAQ={() => {
          setSelectedMeetingId(null);
          setShowAttendeeManager(false);
          setShowFAQ(true);
          setShowTerms(false);
          setShowImprint(false);
        }}
        onGoToImprint={() => {
          setSelectedMeetingId(null);
          setShowAttendeeManager(false);
          setShowFAQ(false);
          setShowTerms(false);
          setShowImprint(true);
        }}
      />

      <div class="container" style={{ minHeight: "75vh" }}>
        <BrandTitle />

        {showFAQ
          ? (
            <FAQ
              onBackToMeetings={() => setShowFAQ(false)}
              hasMeetings={meetings.length > 0}
            />
          )
          : showTerms
          ? (
            <TermsOfService
              onBackToMeetings={() => setShowTerms(false)}
              hasMeetings={meetings.length > 0}
            />
          )
          : showImprint
          ? (
            <Imprint
              onBackToMeetings={() => setShowImprint(false)}
              hasMeetings={meetings.length > 0}
            />
          )
          : showAttendeeManager
          ? (
            <AttendeeManager
              onGoBack={() => setShowAttendeeManager(false)}
            />
          )
          : !selectedMeeting
          ? (meetings.length === 0
            ? (
              <Hero
                onCreateMeeting={handleAddMeeting}
                meetings={meetings}
                onImportMeetings={importMeetings}
                onFlushPendingUpdates={flushPendingUpdates}
                onTermsClick={() => setShowTerms(true)}
                seriesTitle={seriesTitle}
                seriesAgenda={seriesAgenda}
                onUpdateSeries={updateSeries}
              />
            )
            : (
              <>
                {/* Import/Export buttons */}
                <MeetingsImportExport
                  meetings={meetings}
                  setMeetings={importMeetings}
                  onFlushPendingUpdates={flushPendingUpdates}
                  seriesTitle={seriesTitle}
                  seriesAgenda={seriesAgenda}
                  onUpdateSeries={updateSeries}
                />

                {/* Filter button centered */}
                {meetings.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: "2rem",
                    }}
                  >
                    <UnifiedFilter
                      mode="overview"
                      meetings={meetings}
                      onNavigateToMeeting={handleNavigateToMeeting}
                      onToggleTodoCompletion={handleToggleTodoCompletion}
                      isExpanded={showOverviewFilter}
                      onToggleExpanded={() =>
                        setShowOverviewFilter(!showOverviewFilter)}
                      disabled={false}
                    />
                  </div>
                )}

                {/* Responsive Layout: Mobile - Stacked, Tablet+ - Side by Side */}
                <div class="row g-4 mb-4">
                  {/* Left Column: Series Info - Full width on mobile, half on tablet+ */}
                  <div class="col-12 col-md-6">
                    <div
                      class="bg-body-secondary border rounded shadow-sm p-3"
                      style={{
                        transition: "all 0.2s ease",
                        borderColor: "var(--bs-border-color-translucent)",
                        height: "fit-content",
                      }}
                    >
                      <div class="row g-3">
                        {/* Series Title */}
                        <div class="col-12">
                          <label
                            class="form-label fw-semibold text-body-emphasis"
                            for="series-title"
                          >
                            {t("meeting.series.title")}
                          </label>
                          <textarea
                            id="series-title"
                            class="form-control"
                            value={seriesTitle}
                            onInput={(e) =>
                              updateSeries({
                                title: (e.target as HTMLTextAreaElement).value,
                              })}
                            maxLength={APP_CONFIG.SERIES.TITLE_MAX_LENGTH}
                            rows={2}
                            placeholder={t("meeting.series.titlePlaceholder")}
                            style={{
                              transition: "all 0.15s ease",
                              resize: "vertical",
                              minHeight: "60px",
                            }}
                          />
                          <div class="form-text text-end">
                            {seriesTitle.length}/{APP_CONFIG.SERIES
                              .TITLE_MAX_LENGTH}
                          </div>
                        </div>

                        {/* Series Agenda */}
                        <div class="col-12">
                          <label
                            class="form-label fw-semibold text-body-emphasis"
                            for="series-agenda"
                          >
                            {t("meeting.series.agenda")}
                          </label>
                          <textarea
                            id="series-agenda"
                            class="form-control"
                            value={seriesAgenda}
                            onInput={(e) =>
                              updateSeries({
                                agenda: (e.target as HTMLTextAreaElement).value,
                              })}
                            maxLength={APP_CONFIG.SERIES.AGENDA_MAX_LENGTH}
                            rows={APP_CONFIG.SERIES.AGENDA_VISIBLE_ROWS}
                            placeholder={t("meeting.series.agendaPlaceholder")}
                            style={{
                              transition: "all 0.15s ease",
                              resize: "vertical",
                              minHeight: "80px",
                            }}
                          />
                          <div class="form-text text-end">
                            {seriesAgenda.length}/{APP_CONFIG.SERIES
                              .AGENDA_MAX_LENGTH}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Meetings - Full width on mobile, half on tablet+ */}
                  <div class="col-12 col-md-6">
                    {/* New meeting button */}
                    <div class="mb-3">
                      <button
                        className="enhanced-new-meeting-btn"
                        onClick={handleAddMeeting}
                        title={t("meetingIndex.newMeeting")}
                        onMouseEnter={(e) => {
                          const target = e.target as HTMLElement;
                          target.style.boxShadow =
                            "0 6px 20px rgba(139, 92, 246, 0.4)";
                          target.style.transform = "translateY(-2px)";
                          // Activate shine effect
                          const shine = target.querySelector(
                            ".shine-effect",
                          ) as HTMLElement;
                          if (shine) shine.style.left = "100%";
                        }}
                        onMouseLeave={(e) => {
                          const target = e.target as HTMLElement;
                          target.style.boxShadow =
                            "0 4px 12px rgba(139, 92, 246, 0.3)";
                          target.style.transform = "translateY(-1px)";
                          // Reset shine effect
                          const shine = target.querySelector(
                            ".shine-effect",
                          ) as HTMLElement;
                          if (shine) shine.style.left = "-100%";
                        }}
                        style={{
                          background:
                            "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
                          color: "white",
                          border: "2px solid rgba(255,255,255,0.2)",
                          padding: "1.75rem 1.5rem",
                          borderRadius: "12px",
                          fontSize: "1rem",
                          fontWeight: "600",
                          boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
                          transform: "translateY(-1px)",
                          transition: "all 0.2s ease",
                          cursor: "pointer",
                          position: "relative",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          whiteSpace: "nowrap",
                          width: "100%",
                        }}
                      >
                        {/* Icon */}
                        <span style={{ fontSize: "1.1em" }}>+</span>

                        {/* Text with subtle gradient effect */}
                        <span
                          style={{
                            background:
                              "linear-gradient(45deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,1) 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            fontWeight: "600",
                          }}
                        >
                          {t("meetingIndex.newMeeting")}
                        </span>

                        {/* Shine effect */}
                        <div
                          className="shine-effect"
                          style={{
                            position: "absolute",
                            top: "0",
                            left: "-100%",
                            width: "100%",
                            height: "100%",
                            background:
                              "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                            transition: "left 0.6s ease",
                            pointerEvents: "none",
                          }}
                        />
                      </button>
                    </div>

                    {/* List of meetings */}
                    <MeetingIndex
                      meetings={meetings}
                      onSelect={(id) => {
                        setSelectedMeetingId(id);
                        setShowAttendeeManager(false);
                        setShowFAQ(false);
                      }}
                      onDelete={deleteMeeting}
                      onExport={handleExportMeeting}
                    />

                    {/* Export Modal for Meetings List */}
                    {exportMeeting && (
                      <ExportModal
                        isOpen={showExportModal}
                        onClose={handleCloseExportModal}
                        meeting={exportMeeting}
                        onFlushPendingUpdates={flushPendingUpdates}
                      />
                    )}
                  </div>
                </div>
              </>
            ))
          : (
            <div>
              <button
                class="btn btn-link"
                onClick={() => setSelectedMeetingId(null)}
              >
                {t("common.backToMeetings")}
              </button>

              <div class="d-none d-md-flex justify-content-between align-items-center mb-3">
                {/* Centered row for Filter and Download buttons - hidden on mobile, visible on tablets+ */}
                <div class="d-flex justify-content-center align-items-center gap-3 mx-auto">
                  <EnhancedFilterButton
                    onToggle={() => setShowMeetingFilter(!showMeetingFilter)}
                    isExpanded={showMeetingFilter}
                  />
                  <EnhancedDownloadButton
                    onClick={() => setShowExportModal(true)}
                    disabled={!selectedMeeting}
                  />
                </div>
              </div>

              {/* Mobile-only buttons - stacked vertically */}
              <div class="d-flex d-md-none flex-column gap-3 mb-3">
                <EnhancedDownloadButton
                  onClick={() => setShowExportModal(true)}
                  disabled={!selectedMeeting}
                />
                <EnhancedFilterButton
                  onToggle={() => setShowMeetingFilter(!showMeetingFilter)}
                  isExpanded={showMeetingFilter}
                />
              </div>

              {/* Meeting Filter - conditionally rendered */}
              {showMeetingFilter && (
                <div class="mb-3">
                  <UnifiedFilter
                    mode="meeting"
                    meetings={meetings}
                    onNavigateToMeeting={handleNavigateToMeeting}
                    onToggleTodoCompletion={handleToggleTodoCompletion}
                  />
                </div>
              )}

              <form
                class="bg-body-secondary border rounded shadow-sm p-3 mb-4"
                style={{
                  transition: "all 0.2s ease",
                  borderColor: "var(--bs-border-color-translucent)",
                }}
                onSubmit={(e) => e.preventDefault()}
              >
                <div class="row g-3">
                  {/* Title - Full width */}
                  <div class="col-12">
                    <label
                      class="form-label fw-semibold text-body-emphasis"
                      for="meeting-title"
                    >
                      {t("meeting.title")}
                    </label>
                    <input
                      id="meeting-title"
                      ref={titleInputRef}
                      class="form-control"
                      placeholder={t(
                        "meeting.titlePlaceholder",
                      )}
                      value={selectedMeeting.title}
                      onInput={(e) =>
                        handleUpdateMeetingField(
                          "title",
                          (e.target as HTMLInputElement)
                            .value,
                        )}
                      style={{ transition: "all 0.15s ease" }}
                    />
                  </div>

                  {/* Date - Half width on medium screens and up */}
                  <div class="col-md-6">
                    <label
                      class="form-label fw-semibold text-body-emphasis"
                      for="meeting-date"
                    >
                      {t("meeting.date")}
                    </label>
                    <input
                      id="meeting-date"
                      class="form-control"
                      type="date"
                      value={selectedMeeting.date}
                      onInput={(e) =>
                        handleUpdateMeetingField(
                          "date",
                          (e.target as HTMLInputElement)
                            .value,
                        )}
                      style={{ transition: "all 0.15s ease" }}
                    />
                  </div>

                  {/* Time Range - Half width on medium screens and up */}
                  <div class="col-md-6">
                    <label class="form-label fw-semibold text-body-emphasis">
                      {t("meeting.timeRange")}
                    </label>
                    <div class="row g-2">
                      <div class="col-6">
                        <input
                          id="meeting-start-time"
                          class="form-control"
                          type="time"
                          placeholder={t(
                            "meeting.startTime",
                          )}
                          value={selectedMeeting
                            .startTime}
                          onInput={(e) =>
                            handleUpdateMeetingField(
                              "startTime",
                              (e.target as HTMLInputElement)
                                .value,
                            )}
                          style={{ transition: "all 0.15s ease" }}
                        />
                        <small class="form-text text-muted">
                          {t("meeting.startTimeShort")}
                        </small>
                      </div>
                      <div class="col-6">
                        <input
                          id="meeting-end-time"
                          class="form-control"
                          type="time"
                          placeholder={t(
                            "meeting.endTime",
                          )}
                          value={selectedMeeting
                            .endTime}
                          onInput={(e) =>
                            handleUpdateMeetingField(
                              "endTime",
                              (e.target as HTMLInputElement)
                                .value,
                            )}
                          style={{ transition: "all 0.15s ease" }}
                        />
                        <small class="form-text text-muted">
                          {t("meeting.endTimeShort")}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </form>

              {/* Meeting Attendees */}
              <MeetingAttendees
                meeting={selectedMeeting}
                onUpdateMeeting={(updates) =>
                  updateMeeting(selectedMeetingId!, updates)}
              />

              <KanbanBoard
                meetingId={selectedMeetingId}
                meeting={selectedMeeting}
                blockOperations={{
                  addBlock: handleAddBlock,
                  updateBlock: handleUpdateBlock,
                  deleteBlock: handleDeleteBlock,
                  moveBlockToTopic: (
                    blockIndex: number,
                    topicGroupId: string | undefined,
                  ) =>
                    moveBlockToTopic(
                      selectedMeetingId,
                      blockIndex,
                      topicGroupId,
                    ),
                }}
                topicOperations={{
                  createTopicGroup,
                  updateTopicGroup,
                  deleteTopicGroup,
                  swapTopicGroups,
                }}
                newlyCreatedBlockId={newlyCreatedBlockId}
              />

              {/* Export Modal */}
              <ExportModal
                isOpen={showExportModal}
                onClose={handleCloseExportModal}
                meeting={selectedMeeting}
                onFlushPendingUpdates={flushPendingUpdates}
              />
            </div>
          )}
      </div>
      <Footer
        onTermsClick={() => {
          setSelectedMeetingId(null);
          setShowAttendeeManager(false);
          setShowFAQ(false);
          setShowTerms(true);
          setShowImprint(false);
        }}
        onImprintClick={() => {
          setSelectedMeetingId(null);
          setShowAttendeeManager(false);
          setShowFAQ(false);
          setShowTerms(false);
          setShowImprint(true);
        }}
      />
    </>
  );
}

export function App() {
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

  return (
    <I18nProvider>
      {showLoadingScreen && (
        <LoadingScreen
          onLoadingComplete={() => setShowLoadingScreen(false)}
        />
      )}
      <AppContent />
    </I18nProvider>
  );
}

// Only render in non-test environments
if (typeof window !== "undefined" && document.getElementById("app")) {
  render(
    <App />,
    document.getElementById("app"),
  );
}
