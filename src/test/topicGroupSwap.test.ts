import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/preact";
import { useMeetingState } from "../hooks/useMeetingState";
import { Meeting } from "../types/Meeting";

describe("Topic Group Swap Functionality", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it("should swap topic groups left", () => {
    const { result } = renderHook(() => useMeetingState());

    // Add a meeting
    let meeting: Meeting | undefined;
    act(() => {
      meeting = result.current.addMeeting("Test Meeting");
    });

    expect(meeting).toBeDefined();
    const meetingId = meeting!.id;

    // Create three topic groups
    act(() => {
      result.current.createTopicGroup(meetingId, "Group A", "#ff0000");
    });
    act(() => {
      result.current.createTopicGroup(meetingId, "Group B", "#00ff00");
    });
    act(() => {
      result.current.createTopicGroup(meetingId, "Group C", "#0000ff");
    });

    // Get the current meeting
    const meetingBefore = result.current.meetings.find((m) => m.id === meetingId);
    expect(meetingBefore?.topicGroups).toHaveLength(3);

    // Sort by order to get current positions
    const sortedBefore = [...(meetingBefore?.topicGroups || [])].sort(
      (a, b) => a.order - b.order,
    );
    expect(sortedBefore[0].name).toBe("Group A");
    expect(sortedBefore[1].name).toBe("Group B");
    expect(sortedBefore[2].name).toBe("Group C");

    const groupBId = sortedBefore[1].id;

    // Swap Group B to the left (should swap with Group A)
    act(() => {
      result.current.swapTopicGroups(meetingId, groupBId, "left");
    });

    // Get the updated meeting
    const meetingAfter = result.current.meetings.find((m) => m.id === meetingId);
    const sortedAfter = [...(meetingAfter?.topicGroups || [])].sort(
      (a, b) => a.order - b.order,
    );

    // Group B should now be first
    expect(sortedAfter[0].name).toBe("Group B");
    expect(sortedAfter[1].name).toBe("Group A");
    expect(sortedAfter[2].name).toBe("Group C");
  });

  it("should swap topic groups right", () => {
    const { result } = renderHook(() => useMeetingState());

    // Add a meeting
    let meeting: Meeting | undefined;
    act(() => {
      meeting = result.current.addMeeting("Test Meeting");
    });

    expect(meeting).toBeDefined();
    const meetingId = meeting!.id;

    // Create three topic groups
    act(() => {
      result.current.createTopicGroup(meetingId, "Group A", "#ff0000");
    });
    act(() => {
      result.current.createTopicGroup(meetingId, "Group B", "#00ff00");
    });
    act(() => {
      result.current.createTopicGroup(meetingId, "Group C", "#0000ff");
    });

    // Get the current meeting
    const meetingBefore = result.current.meetings.find((m) => m.id === meetingId);
    const sortedBefore = [...(meetingBefore?.topicGroups || [])].sort(
      (a, b) => a.order - b.order,
    );

    const groupBId = sortedBefore[1].id;

    // Swap Group B to the right (should swap with Group C)
    act(() => {
      result.current.swapTopicGroups(meetingId, groupBId, "right");
    });

    // Get the updated meeting
    const meetingAfter = result.current.meetings.find((m) => m.id === meetingId);
    const sortedAfter = [...(meetingAfter?.topicGroups || [])].sort(
      (a, b) => a.order - b.order,
    );

    // Group B should now be last
    expect(sortedAfter[0].name).toBe("Group A");
    expect(sortedAfter[1].name).toBe("Group C");
    expect(sortedAfter[2].name).toBe("Group B");
  });

  it("should not swap first topic group left", () => {
    const { result } = renderHook(() => useMeetingState());

    // Add a meeting
    let meeting: Meeting | undefined;
    act(() => {
      meeting = result.current.addMeeting("Test Meeting");
    });

    const meetingId = meeting!.id;

    // Create two topic groups
    act(() => {
      result.current.createTopicGroup(meetingId, "Group A", "#ff0000");
    });
    act(() => {
      result.current.createTopicGroup(meetingId, "Group B", "#00ff00");
    });

    // Get the current meeting
    const meetingBefore = result.current.meetings.find((m) => m.id === meetingId);
    const sortedBefore = [...(meetingBefore?.topicGroups || [])].sort(
      (a, b) => a.order - b.order,
    );

    const firstGroupId = sortedBefore[0].id;

    // Try to swap the first group left (should do nothing)
    act(() => {
      result.current.swapTopicGroups(meetingId, firstGroupId, "left");
    });

    // Get the updated meeting
    const meetingAfter = result.current.meetings.find((m) => m.id === meetingId);
    const sortedAfter = [...(meetingAfter?.topicGroups || [])].sort(
      (a, b) => a.order - b.order,
    );

    // Order should remain unchanged
    expect(sortedAfter[0].name).toBe("Group A");
    expect(sortedAfter[1].name).toBe("Group B");
  });

  it("should not swap last topic group right", () => {
    const { result } = renderHook(() => useMeetingState());

    // Add a meeting
    let meeting: Meeting | undefined;
    act(() => {
      meeting = result.current.addMeeting("Test Meeting");
    });

    const meetingId = meeting!.id;

    // Create two topic groups
    act(() => {
      result.current.createTopicGroup(meetingId, "Group A", "#ff0000");
    });
    act(() => {
      result.current.createTopicGroup(meetingId, "Group B", "#00ff00");
    });

    // Get the current meeting
    const meetingBefore = result.current.meetings.find((m) => m.id === meetingId);
    const sortedBefore = [...(meetingBefore?.topicGroups || [])].sort(
      (a, b) => a.order - b.order,
    );

    const lastGroupId = sortedBefore[sortedBefore.length - 1].id;

    // Try to swap the last group right (should do nothing)
    act(() => {
      result.current.swapTopicGroups(meetingId, lastGroupId, "right");
    });

    // Get the updated meeting
    const meetingAfter = result.current.meetings.find((m) => m.id === meetingId);
    const sortedAfter = [...(meetingAfter?.topicGroups || [])].sort(
      (a, b) => a.order - b.order,
    );

    // Order should remain unchanged
    expect(sortedAfter[0].name).toBe("Group A");
    expect(sortedAfter[1].name).toBe("Group B");
  });

  it("should handle swapping with only one topic group", () => {
    const { result } = renderHook(() => useMeetingState());

    // Add a meeting
    let meeting: Meeting | undefined;
    act(() => {
      meeting = result.current.addMeeting("Test Meeting");
    });

    const meetingId = meeting!.id;

    // Create only one topic group
    act(() => {
      result.current.createTopicGroup(meetingId, "Group A", "#ff0000");
    });

    // Get the current meeting
    const meetingBefore = result.current.meetings.find((m) => m.id === meetingId);
    const groupId = meetingBefore?.topicGroups![0].id;

    // Try to swap in both directions (should do nothing)
    act(() => {
      result.current.swapTopicGroups(meetingId, groupId!, "left");
    });

    let meetingAfter = result.current.meetings.find((m) => m.id === meetingId);
    expect(meetingAfter?.topicGroups).toHaveLength(1);
    expect(meetingAfter?.topicGroups![0].name).toBe("Group A");

    act(() => {
      result.current.swapTopicGroups(meetingId, groupId!, "right");
    });

    meetingAfter = result.current.meetings.find((m) => m.id === meetingId);
    expect(meetingAfter?.topicGroups).toHaveLength(1);
    expect(meetingAfter?.topicGroups![0].name).toBe("Group A");
  });

  it("should update topic groups in memory after swap", () => {
    const { result } = renderHook(() => useMeetingState());

    // Add a meeting
    let meeting: Meeting | undefined;
    act(() => {
      meeting = result.current.addMeeting("Test Meeting");
    });

    const meetingId = meeting!.id;

    // Create two topic groups
    act(() => {
      result.current.createTopicGroup(meetingId, "Group A", "#ff0000");
    });
    act(() => {
      result.current.createTopicGroup(meetingId, "Group B", "#00ff00");
    });

    const meetingBefore = result.current.meetings.find((m) => m.id === meetingId);
    const sortedBefore = [...(meetingBefore?.topicGroups || [])].sort(
      (a, b) => a.order - b.order,
    );
    const groupBId = sortedBefore[1].id;

    // Swap Group B to the left
    act(() => {
      result.current.swapTopicGroups(meetingId, groupBId, "left");
    });

    // Verify in-memory state is updated immediately
    const meetingAfter = result.current.meetings.find((m) => m.id === meetingId);
    const sortedAfter = [...(meetingAfter?.topicGroups || [])].sort(
      (a, b) => a.order - b.order,
    );

    expect(sortedAfter[0].name).toBe("Group B");
    expect(sortedAfter[1].name).toBe("Group A");
    expect(sortedAfter[0].order).toBeLessThan(sortedAfter[1].order);
  });
});
