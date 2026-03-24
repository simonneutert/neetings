/**
 * Tests for drag-and-drop into empty Kanban columns.
 *
 * Regression: blocks could not be dropped into a newly created (empty) topic
 * column because `closestCenter` collision detection picks the droppable whose
 * center is geometrically closest to the pointer — an empty column has no
 * sortable items so the column container center is far away and never wins.
 *
 * Fix: use `pointerWithin` first (cursor physically inside a rect) and fall
 * back to `closestCenter`. This test validates the `useDragDrop` handleDragEnd
 * logic, which was always correct; the tests serve as a regression net.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/preact";
import { useDragDrop } from "../hooks/useDragDrop";
import { Block } from "../types/Block";
import { generateSortKey } from "../utils/sortKeys";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBlock(
  overrides: Partial<Block> & { id: string },
): Block {
  return {
    type: "note",
    content: "test block",
    topicGroupId: null,
    sortKey: generateSortKey(),
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeDragEndEvent(
  activeId: string,
  activeData: Record<string, unknown>,
  overId: string,
  overData: Record<string, unknown>,
) {
  return {
    active: {
      id: activeId,
      data: { current: activeData },
      rect: { current: { initial: null, translated: null } },
    },
    over: {
      id: overId,
      data: { current: overData },
      rect: { width: 300, height: 400, left: 0, top: 0, right: 300, bottom: 400 },
      disabled: false,
    },
    activatorEvent: null,
    collisions: null,
    delta: { x: 0, y: 0 },
  } as unknown as import("@dnd-kit/core").DragEndEvent;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useDragDrop – dropping into empty column", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("moves a block from default column into a new empty named column", () => {
    const blockId = "block-abc";
    const targetTopicId = "topic-new";

    const block = makeBlock({ id: blockId, topicGroupId: null });

    // groupedBlocks: the block lives in the null (default) column; target column is empty
    const groupedBlocks = new Map<string | null, Block[]>([
      [null, [block]],
      [targetTopicId, []],
    ]);

    const updateBlockById = vi.fn();

    const { result } = renderHook(() =>
      useDragDrop({ groupedBlocks, updateBlockById })
    );

    const event = makeDragEndEvent(
      `block-${blockId}-default`,
      {
        type: "block",
        blockIndex: 0,
        fromTopicId: null,
        block,
        globalBlockId: blockId,
      },
      targetTopicId,
      { type: "column", topicId: targetTopicId },
    );

    act(() => {
      result.current.handleDragEnd(event);
    });

    expect(updateBlockById).toHaveBeenCalledOnce();
    const [calledId, updates] = updateBlockById.mock.calls[0];
    expect(calledId).toBe(blockId);
    expect(updates.topicGroupId).toBe(targetTopicId);
    expect(typeof updates.sortKey).toBe("string");
    expect(updates.sortKey.length).toBeGreaterThan(0);
  });

  it("moves a block from one named column into a different empty named column", () => {
    const blockId = "block-xyz";
    const fromTopicId = "topic-alpha";
    const targetTopicId = "topic-beta";

    const block = makeBlock({ id: blockId, topicGroupId: fromTopicId });

    const groupedBlocks = new Map<string | null, Block[]>([
      [fromTopicId, [block]],
      [targetTopicId, []], // empty target
    ]);

    const updateBlockById = vi.fn();

    const { result } = renderHook(() =>
      useDragDrop({ groupedBlocks, updateBlockById })
    );

    const event = makeDragEndEvent(
      `block-${blockId}-${fromTopicId}`,
      {
        type: "block",
        blockIndex: 0,
        fromTopicId,
        block,
        globalBlockId: blockId,
      },
      targetTopicId,
      { type: "column", topicId: targetTopicId },
    );

    act(() => {
      result.current.handleDragEnd(event);
    });

    expect(updateBlockById).toHaveBeenCalledOnce();
    const [calledId, updates] = updateBlockById.mock.calls[0];
    expect(calledId).toBe(blockId);
    expect(updates.topicGroupId).toBe(targetTopicId);
    expect(typeof updates.sortKey).toBe("string");
  });

  it("does NOT move a block when dropped onto the same empty-looking column", () => {
    const blockId = "block-same";
    const topicId = "topic-same";

    const block = makeBlock({ id: blockId, topicGroupId: topicId });

    const groupedBlocks = new Map<string | null, Block[]>([
      [topicId, [block]],
    ]);

    const updateBlockById = vi.fn();

    const { result } = renderHook(() =>
      useDragDrop({ groupedBlocks, updateBlockById })
    );

    // active and over are both in the same column (over is the column container)
    const event = makeDragEndEvent(
      `block-${blockId}-${topicId}`,
      {
        type: "block",
        blockIndex: 0,
        fromTopicId: topicId,
        block,
        globalBlockId: blockId,
      },
      topicId,
      { type: "column", topicId },
    );

    act(() => {
      result.current.handleDragEnd(event);
    });

    // Same topic - should be a no-op
    expect(updateBlockById).not.toHaveBeenCalled();
  });

  it("appends block after existing blocks when dropping into non-empty column", () => {
    const blockId = "block-mover";
    const fromTopicId = "topic-source";
    const targetTopicId = "topic-dest";

    const existingBlock = makeBlock({
      id: "block-existing",
      topicGroupId: targetTopicId,
      sortKey: "a0",
    });
    const movedBlock = makeBlock({
      id: blockId,
      topicGroupId: fromTopicId,
      sortKey: "b0",
    });

    const groupedBlocks = new Map<string | null, Block[]>([
      [fromTopicId, [movedBlock]],
      [targetTopicId, [existingBlock]],
    ]);

    const updateBlockById = vi.fn();

    const { result } = renderHook(() =>
      useDragDrop({ groupedBlocks, updateBlockById })
    );

    const event = makeDragEndEvent(
      `block-${blockId}-${fromTopicId}`,
      {
        type: "block",
        blockIndex: 0,
        fromTopicId,
        block: movedBlock,
        globalBlockId: blockId,
      },
      targetTopicId,
      { type: "column", topicId: targetTopicId },
    );

    act(() => {
      result.current.handleDragEnd(event);
    });

    expect(updateBlockById).toHaveBeenCalledOnce();
    const [calledId, updates] = updateBlockById.mock.calls[0];
    expect(calledId).toBe(blockId);
    expect(updates.topicGroupId).toBe(targetTopicId);
    // The new sortKey should sort after the existing block's sortKey "a0"
    expect(updates.sortKey > existingBlock.sortKey).toBe(true);
  });
});

describe("useDragDrop – inter-column drop on last block inserts before it", () => {
  it("dropping on the last block of a target column inserts before it, not after", () => {
    const movingBlockId = "block-mover";
    const fromTopicId = "topic-source";
    const targetTopicId = "topic-dest";

    const firstBlock = makeBlock({
      id: "block-first",
      topicGroupId: targetTopicId,
      sortKey: "e",
    });
    const lastBlock = makeBlock({
      id: "block-last",
      topicGroupId: targetTopicId,
      sortKey: "p",
    });
    const movingBlock = makeBlock({
      id: movingBlockId,
      topicGroupId: fromTopicId,
      sortKey: "m",
    });

    const groupedBlocks = new Map<string | null, Block[]>([
      [fromTopicId, [movingBlock]],
      [targetTopicId, [firstBlock, lastBlock]],
    ]);

    const updateBlockById = vi.fn();
    const { result } = renderHook(() =>
      useDragDrop({ groupedBlocks, updateBlockById })
    );

    // Drop directly onto the LAST block of the target column
    const event = makeDragEndEvent(
      `block-${movingBlockId}-${fromTopicId}`,
      {
        type: "block",
        blockIndex: 0,
        fromTopicId,
        block: movingBlock,
        globalBlockId: movingBlockId,
      },
      `block-${lastBlock.id}-${targetTopicId}`,
      {
        type: "block",
        fromTopicId: targetTopicId,
        globalBlockId: lastBlock.id,
      },
    );

    act(() => {
      result.current.handleDragEnd(event);
    });

    expect(updateBlockById).toHaveBeenCalledOnce();
    const [, updates] = updateBlockById.mock.calls[0];
    // Inserted before "p" (lastBlock.sortKey), so must be between "e" and "p"
    expect(updates.sortKey > firstBlock.sortKey).toBe(true);
    expect(updates.sortKey < lastBlock.sortKey).toBe(true);
  });

  it("dropping on a middle block of a target column inserts before it", () => {
    const movingBlockId = "block-mover2";
    const fromTopicId = "topic-source2";
    const targetTopicId = "topic-dest2";

    const blockA = makeBlock({ id: "ba", topicGroupId: targetTopicId, sortKey: "b" });
    const blockB = makeBlock({ id: "bb", topicGroupId: targetTopicId, sortKey: "m" });
    const blockC = makeBlock({ id: "bc", topicGroupId: targetTopicId, sortKey: "t" });
    const movingBlock = makeBlock({ id: movingBlockId, topicGroupId: fromTopicId, sortKey: "z" });

    const groupedBlocks = new Map<string | null, Block[]>([
      [fromTopicId, [movingBlock]],
      [targetTopicId, [blockA, blockB, blockC]],
    ]);

    const updateBlockById = vi.fn();
    const { result } = renderHook(() =>
      useDragDrop({ groupedBlocks, updateBlockById })
    );

    // Drop onto blockB (the middle block)
    const event = makeDragEndEvent(
      `block-${movingBlockId}-${fromTopicId}`,
      {
        type: "block",
        blockIndex: 0,
        fromTopicId,
        block: movingBlock,
        globalBlockId: movingBlockId,
      },
      `block-${blockB.id}-${targetTopicId}`,
      {
        type: "block",
        fromTopicId: targetTopicId,
        globalBlockId: blockB.id,
      },
    );

    act(() => {
      result.current.handleDragEnd(event);
    });

    expect(updateBlockById).toHaveBeenCalledOnce();
    const [, updates] = updateBlockById.mock.calls[0];
    // Must land between blockA ("b") and blockB ("m")
    expect(updates.sortKey > blockA.sortKey).toBe(true);
    expect(updates.sortKey < blockB.sortKey).toBe(true);
  });
});
