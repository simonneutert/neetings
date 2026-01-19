import { createEmptyMeeting, Meeting } from "../../types/Meeting";
import { Block, BLOCK_TYPES, createBlock } from "../../types/Block";
import { Attendee, createAttendee } from "../../types/Attendee";
import { TopicGroup } from "../../types/TopicGroup";
import { generateSortKey } from "../../utils/sortKeys";

export interface TestMeetingSeries {
  title: string;
  agenda: string;
  attendees: Attendee[];
  meetings: Meeting[];
}

export class TestDataFactory {
  private static counter = 0;

  static getUniqueId(): string {
    return `test-${Date.now()}-${++this.counter}`;
  }

  static createMeeting(overrides?: Partial<Meeting>): Meeting {
    const id = overrides?.id || this.getUniqueId();
    const baseMeeting = createEmptyMeeting(id);

    return {
      ...baseMeeting,
      title: `Test Meeting ${this.counter}`,
      date: "2024-01-15",
      startTime: "10:00",
      endTime: "11:00",
      ...overrides,
    };
  }

  static createAttendee(overrides?: Partial<Attendee>): Attendee {
    const baseAttendee = createAttendee();

    return {
      ...baseAttendee,
      name: `Test Attendee ${this.counter}`,
      email: `test${this.counter}@example.com`,
      ...overrides,
    };
  }

  static createBlock(
    type: Block["type"],
    overrides?: Partial<Block>,
  ): Block {
    const baseBlock = createBlock(type);
    const blockType = BLOCK_TYPES[type];

    const blockData: Partial<Block> = {
      ...baseBlock,
      ...overrides,
    };

    // Set default content based on block type
    blockType.fields.forEach((field) => {
      if (!blockData[field as keyof Block]) {
        (blockData as any)[field] = `Test ${field} content ${this.counter}`;
      }
    });

    return blockData as Block;
  }

  static createTopicGroup(
    meetingId: string,
    overrides?: Partial<TopicGroup>,
  ): TopicGroup {
    const now = new Date().toISOString();

    return {
      id: this.getUniqueId(),
      name: `Test Topic Group ${this.counter}`,
      color: "primary",
      order: 0,
      meetingId,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  static createMeetingWithBlocks(
    blockCount: number = 3,
    overrides?: Partial<Meeting>,
  ): Meeting {
    const meeting = this.createMeeting(overrides);
    const blockTypes = Object.keys(BLOCK_TYPES) as Array<
      keyof typeof BLOCK_TYPES
    >;

    const blocks: Block[] = [];
    for (let i = 0; i < blockCount; i++) {
      const blockType = blockTypes[i % blockTypes.length];
      blocks.push(this.createBlock(blockType, {
        sortKey: generateSortKey(),
        topicGroupId: null,
      }));
    }

    return {
      ...meeting,
      blocks,
    };
  }

  static createMeetingWithTopicGroups(
    groupCount: number = 2,
    blocksPerGroup: number = 2,
    overrides?: Partial<Meeting>,
  ): Meeting {
    const meeting = this.createMeeting(overrides);
    const topicGroups: TopicGroup[] = [];
    const blocks: Block[] = [];

    for (let i = 0; i < groupCount; i++) {
      const topicGroup = this.createTopicGroup(meeting.id, {
        order: i,
        name: `Topic Group ${i + 1}`,
      });
      topicGroups.push(topicGroup);

      for (let j = 0; j < blocksPerGroup; j++) {
        const block = this.createBlock("textblock", {
          topicGroupId: topicGroup.id,
          sortKey: generateSortKey(),
        });
        blocks.push(block);
      }
    }

    return {
      ...meeting,
      topicGroups,
      blocks,
    };
  }

  static createMeetingWithAttendees(
    attendeeCount: number = 3,
    overrides?: Partial<Meeting>,
  ): { meeting: Meeting; attendees: Attendee[] } {
    const attendees: Attendee[] = [];
    const attendeeIds: string[] = [];

    for (let i = 0; i < attendeeCount; i++) {
      const attendee = this.createAttendee({
        name: `Attendee ${i + 1}`,
        email: `attendee${i + 1}@test.com`,
      });
      attendees.push(attendee);
      attendeeIds.push(attendee.id);
    }

    const meeting = this.createMeeting({
      attendeeIds,
      ...overrides,
    });

    return { meeting, attendees };
  }

  static createMeetingSeries(
    meetingCount: number = 3,
    overrides?: Partial<TestMeetingSeries>,
  ): TestMeetingSeries {
    const attendees = [
      this.createAttendee({ name: "Alice Smith", email: "alice@test.com" }),
      this.createAttendee({ name: "Bob Johnson", email: "bob@test.com" }),
      this.createAttendee({ name: "Carol Davis", email: "carol@test.com" }),
    ];

    const meetings: Meeting[] = [];
    const attendeeIds = attendees.map((a) => a.id);

    for (let i = 0; i < meetingCount; i++) {
      const meeting = this.createMeetingWithBlocks(3, {
        title: `Series Meeting ${i + 1}`,
        date: new Date(2024, 0, 15 + i).toISOString().slice(0, 10),
        attendeeIds,
      });
      meetings.push(meeting);
    }

    return {
      title: "Test Meeting Series",
      agenda: "Test series agenda",
      attendees,
      meetings,
      ...overrides,
    };
  }

  static createLargeMeetingSeries(
    meetingCount: number = 100,
    blocksPerMeeting: number = 10,
  ): TestMeetingSeries {
    const attendees: Attendee[] = [];

    // Create 20 attendees
    for (let i = 0; i < 20; i++) {
      attendees.push(this.createAttendee({
        name: `Attendee ${i + 1}`,
        email: `attendee${i + 1}@large-test.com`,
      }));
    }

    const meetings: Meeting[] = [];
    const attendeeIds = attendees.map((a) => a.id);

    for (let i = 0; i < meetingCount; i++) {
      const meeting = this.createMeetingWithBlocks(blocksPerMeeting, {
        title: `Large Series Meeting ${i + 1}`,
        date: new Date(2024, 0, 1 + i).toISOString().slice(0, 10),
        attendeeIds,
      });
      meetings.push(meeting);
    }

    return {
      title: "Large Test Meeting Series",
      agenda: "Large test series for performance testing",
      attendees,
      meetings,
    };
  }

  static createCorruptedMeetingData(): any {
    return {
      // Missing required fields
      title: "Corrupted Meeting",
      blocks: [
        {
          id: "invalid-block",
          type: "invalid-type", // Invalid block type
          // Missing required fields
        },
      ],
      // Missing attendeeIds, dates, etc.
    };
  }

  static createInvalidExportData(): any {
    return {
      version: "999.0.0", // Invalid version
      exportedAt: "invalid-date",
      meetings: [
        {
          id: null, // Invalid ID
          title: "",
          blocks: "not-an-array", // Invalid blocks
        },
      ],
    };
  }

  static createPartiallyValidExportData(): any {
    const validMeeting = this.createMeeting();
    const invalidMeeting = {
      id: "invalid-meeting",
      title: "", // Empty title
      blocks: [], // Valid but empty
      attendeeIds: ["non-existent-attendee"], // Invalid attendee reference
    };

    return {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      title: "Mixed Valid/Invalid Export",
      agenda: "Test agenda",
      attendees: [this.createAttendee()],
      meetings: [validMeeting, invalidMeeting],
    };
  }

  static reset(): void {
    this.counter = 0;
  }
}

// Convenience functions for common test scenarios
export const createTestMeeting = (overrides?: Partial<Meeting>) =>
  TestDataFactory.createMeeting(overrides);

export const createTestAttendee = (overrides?: Partial<Attendee>) =>
  TestDataFactory.createAttendee(overrides);

export const createTestBlock = (
  type: Block["type"],
  overrides?: Partial<Block>,
) => TestDataFactory.createBlock(type, overrides);

export const createTestTopicGroup = (
  meetingId: string,
  overrides?: Partial<TopicGroup>,
) => TestDataFactory.createTopicGroup(meetingId, overrides);

export const createTestMeetingSeries = (
  meetingCount?: number,
  overrides?: Partial<TestMeetingSeries>,
) => TestDataFactory.createMeetingSeries(meetingCount, overrides);
