import { useCallback } from "preact/hooks";
import { generateUUID } from "../utils/uuid";
import { DEFAULT_TOPIC_GROUPS, TopicGroup } from "../types/TopicGroup";
import { Meeting, MeetingUpdateData } from "../types/Meeting";

interface UseTopicGroupsResult {
  createTopicGroup: (
    meetingId: string,
    name: string,
    color?: string,
  ) => TopicGroup;
  updateTopicGroup: (
    topicGroup: TopicGroup,
    updates: Partial<TopicGroup>,
  ) => TopicGroup;
  deleteTopicGroup: (meeting: Meeting, topicGroupId: string) => {
    updatedMeeting: MeetingUpdateData;
    orphanedBlocks: string[];
  };
  moveBlockToTopic: (
    meeting: Meeting,
    blockIndex: number,
    topicGroupId: string | null,
  ) => MeetingUpdateData;
  ensureDefaultTopicGroups: (meeting: Meeting) => MeetingUpdateData | null;
  getTopicGroupById: (
    meeting: Meeting,
    topicGroupId: string,
  ) => TopicGroup | undefined;
}

export function useTopicGroups(): UseTopicGroupsResult {
  const createTopicGroup = useCallback((
    meetingId: string,
    name: string,
    color?: string,
  ): TopicGroup => {
    const now = new Date().toISOString();
    return {
      id: generateUUID(),
      name,
      color,
      order: Date.now(), // Simple ordering by creation time
      meetingId,
      createdAt: now,
      updatedAt: now,
    };
  }, []);

  const updateTopicGroup = useCallback((
    topicGroup: TopicGroup,
    updates: Partial<TopicGroup>,
  ): TopicGroup => {
    return {
      ...topicGroup,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  }, []);

  const deleteTopicGroup = useCallback((
    meeting: Meeting,
    topicGroupId: string,
  ) => {
    const updatedTopicGroups = (meeting.topicGroups || [])
      .filter((tg) => tg.id !== topicGroupId);

    // Find blocks that will become orphaned
    const orphanedBlocks = meeting.blocks
      .filter((block) => block.topicGroupId === topicGroupId)
      .map((block) => block.id!);

    // Remove topicGroupId from orphaned blocks
    const updatedBlocks = meeting.blocks.map((block) =>
      block.topicGroupId === topicGroupId
        ? { ...block, topicGroupId: undefined }
        : block
    );

    return {
      updatedMeeting: {
        topicGroups: updatedTopicGroups,
        blocks: updatedBlocks,
      },
      orphanedBlocks,
    };
  }, []);

  const moveBlockToTopic = useCallback((
    meeting: Meeting,
    blockIndex: number,
    topicGroupId: string | null,
  ): MeetingUpdateData => {
    const updatedBlocks = [...meeting.blocks];
    updatedBlocks[blockIndex] = {
      ...updatedBlocks[blockIndex],
      topicGroupId: topicGroupId || undefined,
    };

    return { blocks: updatedBlocks };
  }, []);

  const ensureDefaultTopicGroups = useCallback(
    (meeting: Meeting): MeetingUpdateData | null => {
      if (!meeting.topicGroups || meeting.topicGroups.length === 0) {
        const defaultGroups = Object.values(DEFAULT_TOPIC_GROUPS).map(
          (groupTemplate) =>
            createTopicGroup(
              meeting.id,
              groupTemplate.name,
              groupTemplate.color,
            ),
        );

        return { topicGroups: defaultGroups };
      }
      return null;
    },
    [createTopicGroup],
  );

  const getTopicGroupById = useCallback((
    meeting: Meeting,
    topicGroupId: string,
  ): TopicGroup | undefined => {
    return meeting.topicGroups?.find((tg) => tg.id === topicGroupId);
  }, []);

  return {
    createTopicGroup,
    updateTopicGroup,
    deleteTopicGroup,
    moveBlockToTopic,
    ensureDefaultTopicGroups,
    getTopicGroupById,
  };
}
