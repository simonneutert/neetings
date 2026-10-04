import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/preact";
import { useMeetingState } from "../hooks/useMeetingState.ts";
import { APP_CONFIG } from "../constants/index.ts";
import { TestDataFactory } from "./factories/testDataFactory.ts";

describe("deleteTopicGroup", () => {
  beforeEach(() => {
    localStorage.clear();
    TestDataFactory.reset();
  });

  it("moves the group's blocks to the default column with topicGroupId null", async () => {
    const meeting = TestDataFactory.createMeeting({ id: "m1" });
    const group = TestDataFactory.createTopicGroup(meeting.id, { id: "g1" });
    const block = TestDataFactory.createBlock("textblock", {
      topicGroupId: group.id,
    });
    localStorage.setItem(
      APP_CONFIG.LOCAL_STORAGE_KEYS.MEETINGS,
      JSON.stringify([{ ...meeting, topicGroups: [group], blocks: [block] }]),
    );

    const { result } = renderHook(() => useMeetingState());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      result.current.deleteTopicGroup("m1", "g1");
      await result.current.flushPendingUpdates();
    });

    const updated = result.current.meetings.find((m) => m.id === "m1")!;
    expect(updated.topicGroups).toHaveLength(0);
    // null (not undefined) is what the schema and exporters expect
    expect(updated.blocks[0].topicGroupId).toBeNull();
  });
});
