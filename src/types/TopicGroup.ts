// Topic Group type definitions for kanban-style meeting organization
export interface TopicGroup {
  id: string;
  name: string;
  color?: string; // Semantic color for visual distinction
  order: number; // Display order in the kanban board
  meetingId: string; // Belongs to specific meeting
  createdAt: string;
  updatedAt: string;
}

// Default topic groups that can be created for new meetings
export const DEFAULT_TOPIC_GROUPS = {
  MAIN_AGENDA: {
    name: "Main Agenda",
    color: "primary",
    order: 0,
  },
  SIDE_TOPICS: {
    name: "Side Topics",
    color: "secondary",
    order: 1,
  },
  ACTION_ITEMS: {
    name: "Action Items",
    color: "success",
    order: 2,
  },
} as const;

// Topic group CRUD operations
export interface TopicGroupOperations {
  createTopicGroup: (
    meetingId: string,
    name: string,
    color?: string,
  ) => TopicGroup;
  updateTopicGroup: (id: string, updates: Partial<TopicGroup>) => TopicGroup;
  deleteTopicGroup: (id: string) => void;
  reorderTopicGroups: (meetingId: string, groupIds: string[]) => void;
}
