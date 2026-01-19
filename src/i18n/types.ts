// Translation types for type safety
export type Language = "en" | "de";

export interface Translations {
  navigation: {
    brand: string;
    meetings: string;
    faq: string;
    github: string;
    clearMeeting: string;
    clearAllData: string;
    toggleNavigation: string;
  };
  blocks: {
    types: {
      goalblock: string;
      todoblock: string;
      followupblock: string;
      ideablock: string;
      factblock: string;
      researchblock: string;
      textblock: string;
      qandablock: string;
      referenceblock: string;
      decisionblock: string;
      issueblock: string;
    };
    creator: {
      title: string;
      buttonPrefix: string;
    };
    fields: {
      text: string;
      question: string;
      answer: string;
      topic: string;
      result: string;
      fact: string;
      decision: string;
      issue: string;
      todo: string;
      goal: string;
      followup: string;
      idea: string;
      reference: string;
    };
    placeholders: {
      text: string;
      question: string;
      answer: string;
      topic: string;
      result: string;
      fact: string;
      decision: string;
      issue: string;
      todo: string;
      goal: string;
      followup: string;
      idea: string;
      reference: string;
    };
    status: {
      completed: string;
      pending: string;
    };
    actions: {
      moveUp: string;
      moveDown: string;
      delete: string;
    };
  };
  confirmations: {
    clearMeeting: string;
    clearAllData: string;
    deleteMeeting: string;
  };
  search: {
    placeholder: string;
    noResults: string;
  };
  filter: {
    showAll: string;
    backToMeetings: string;
    showFilters: string;
    hideFilters: string;
    filtersTitle: string;
    searchPlaceholder: string;
    clearSearch: string;
    searching: string;
    searchingFor: string;
    showing: string;
    noFiltersSelected: string;
    dateRangeTitle: string;
    dateFrom: string;
    dateTo: string;
    showAllDates: string;
    pastTen: string;
    meetingsInRange: string;
    noResultsFor: string;
    noFiltersMessage: string;
    noContentFound: string;
    filterTypes: {
      todos_completed: string;
      todos_uncompleted: string;
      facts: string;
      qandas: string;
      decisions: string;
      issues: string;
      research: string;
      stories: string;
      goals: string;
      followups: string;
      ideas: string;
      references: string;
    };
    todoStats: string;
    noDate: string;
  };
  meeting: {
    untitled: string;
    createdOn: string;
    lastModified: string;
    blocks: string;
    title: string;
    titlePlaceholder: string;
    date: string;
    timeRange: string;
    startTime: string;
    startTimeShort: string;
    endTime: string;
    endTimeShort: string;
    lastUpdate: string;
  };
  meetingIndex: {
    title: string;
    newMeeting: string;
    noMeetings: string;
    deleteMeetingTitle: string;
  };
  importExport: {
    import: string;
    export: string;
    importSuccess: string;
    importError: string;
    noMeetingsToExport: string;
    exportSuccess: string;
    exportError: string;
  };
}

export type TranslationKey =
  | keyof Translations
  | `${keyof Translations}.${string}`;
