// Application constants
export const APP_CONFIG = {
  AUTO_SAVE_DELAY: 500, // milliseconds
  FOCUS_CLEAR_DELAY: 50, // milliseconds
  SCROLL_DELAY: 100, // milliseconds
  LOCAL_STORAGE_KEYS: {
    MEETINGS: "meetings",
    LAST_VIEW: "lastView",
    ATTENDEES: "attendees",
    LANGUAGE: "language",
    FILTER_PREFERENCES: "filterPreferences",
  },
  DEFAULT_VALUES: {
    MEETING_TITLE: "Untitled Meeting",
    OVERVIEW_VIEW: "overview",
    SERIES_TITLE: "New Meeting Series",
    SERIES_AGENDA: "",
  },
  UI: {
    MAX_INPUT_WIDTH: {
      TITLE: 300,
      TIME: 120,
      DATE: 160,
    },
    TEXTAREA_ROWS: 2,
  },
  SERIES: {
    TITLE_MAX_LENGTH: 280,
    AGENDA_MAX_LENGTH: 600,
    AGENDA_VISIBLE_ROWS: 5,
  },
} as const;

// Filter constants
export const FILTER_CONFIG = {
  DASHBOARD_TITLE: "📊 View Dashboard",
  DASHBOARD_HIDE: "📊 Hide Dashboard",
  NO_FILTERS_MESSAGE: "Please select at least one filter to view content.",
} as const;

// Block field types that should render as textareas
export const TEXTAREA_FIELDS = [
  "text",
  "question",
  "answer",
  "topic",
  "result",
  "fact",
  "decision",
  "issue",
  "todo",
  "goal",
  "followup",
  "idea",
  "reference",
] as const;

// Confirmation messages
export const CONFIRM_MESSAGES = {
  DELETE_BLOCK: "Are you sure you want to delete this block?",
  CLEAR_MEETING:
    "Are you sure you want to clear this meeting? This will delete all notes and metadata for this meeting.",
  CLEAR_ALL_DATA:
    "Are you sure you want to clear all data? This will delete all meetings and cannot be undone.",
} as const;

// Search constants
export const SEARCH_DEBOUNCE_DELAY = 500; // Default debounce delay in milliseconds
export const MIN_SEARCH_CHARACTERS = 3; // Minimum characters required to start search

// Attendee search configuration
export const ATTENDEE_SEARCH_CONFIG = {
  DEBOUNCE_DELAY: 300, // Faster for smaller datasets
  MIN_LENGTH: 2, // Start searching after 2 characters
} as const;

// Topic Groups constants
export const TOPIC_GROUPS = {
  LABELS: {
    ADD_GROUP: "Add Topic Group",
    EDIT_GROUP: "Edit Group",
    DELETE_GROUP: "Delete Group",
    CREATE_COLUMN: "Create Column",
    MOVE_BLOCK: "Move Block",
  },
  PLACEHOLDERS: {
    GROUP_NAME: "Enter topic name...",
    EMPTY_COLUMN: "No blocks yet. Drag blocks here or add new ones.",
    DEFAULT_COLUMN: "Main Discussion",
  },
  CONFIRMATIONS: {
    DELETE_GROUP: "Delete this topic group? Blocks will be moved to ungrouped.",
  },
} as const;

// Export translation keys (centralized for consistency)
export const EXPORT_TRANSLATION_KEYS = {
  CONTENT: {
    CREATED: "importExport.content.created",
    LAST_MODIFIED: "importExport.content.lastModified",
    TOTAL_BLOCKS: "importExport.content.totalBlocks",
    TABLE_OF_CONTENTS: "importExport.content.tableOfContents",
    BLOCKS: "importExport.content.blocks",
    NO_BLOCKS_IN_SECTION: "importExport.content.noBlocksInSection",
  },
  ACTIONS: {
    EXPORT_MEETING: "importExport.actions.exportMeeting",
    EXPORT_BUTTON: "importExport.actions.exportButtonText",
  },
  MODAL: {
    TITLE: "importExport.modal.title",
    CLOSE: "common.close",
    FORMAT: "importExport.modal.format",
    FORMAT_MARKDOWN: "importExport.modal.formatMarkdown",
    FORMAT_COMING_SOON: "importExport.modal.formatComingSoon",
    FILENAME: "importExport.modal.filename",
    FILENAME_PLACEHOLDER: "importExport.modal.filenamePlaceholder",
    FILENAME_REQUIRED: "importExport.modal.filenameRequired",
    EXPORT_FAILED: "importExport.modal.exportFailed",
    CANCEL: "common.cancel",
    EXPORTING: "importExport.modal.exporting",
    EXPORT_BUTTON: "importExport.modal.exportButton",
  },
  BLOCKS: {
    FIELD_LABELS: {
      QUESTION: "blocks.fields.question",
      ANSWER: "blocks.fields.answer",
      TOPIC: "blocks.fields.topic",
      RESULT: "blocks.fields.result",
    },
  },
} as const;
