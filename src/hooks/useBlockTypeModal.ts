/**
 * Custom hook for managing block type selection modal state and operations
 */

import { useCallback, useState } from "preact/hooks";
import { Block } from "../types/Block";
import { TopicGroup } from "../types/TopicGroup";

/**
 * Context for editing block types
 */
interface EditBlockTypeContext {
  block: Block;
  index: number;
  topicId: string | null;
}

interface BlockTypeModalOperations {
  showBlockTypeModal: boolean;
  pendingTopicGroupId: string | undefined;
  editBlockTypeContext: EditBlockTypeContext | null;

  openModalForNewBlock: (topicGroupId?: string) => void;
  openModalForEditBlock: (
    block: Block,
    index: number,
    topicId: string | null,
  ) => void;
  closeModal: () => void;

  handleBlockTypeSelect: (
    blockType: Block["type"],
    onCreateNewBlock: (blockType: Block["type"], topicGroupId?: string) => void,
  ) => void;

  handleEditBlockTypeSelect: (
    newType: Block["type"],
    onChangeBlockType: (blockId: string, newType: Block["type"]) => void,
  ) => void;

  getTopicGroupName: (topicGroups: TopicGroup[]) => string;
}

/**
 * Hook that manages block type modal state and operations
 */
export function useBlockTypeModal(): BlockTypeModalOperations {
  const [showBlockTypeModal, setShowBlockTypeModal] = useState(false);
  const [pendingTopicGroupId, setPendingTopicGroupId] = useState<
    string | undefined
  >(undefined);
  const [editBlockTypeContext, setEditBlockTypeContext] = useState<
    EditBlockTypeContext | null
  >(null);

  const openModalForNewBlock = useCallback((topicGroupId?: string) => {
    setPendingTopicGroupId(topicGroupId);
    setShowBlockTypeModal(true);
    setEditBlockTypeContext(null);
  }, []);

  const openModalForEditBlock = useCallback((
    block: Block,
    index: number,
    topicId: string | null,
  ) => {
    setEditBlockTypeContext({ block, index, topicId });
    setShowBlockTypeModal(true);
    setPendingTopicGroupId(topicId || undefined);
  }, []);

  const closeModal = useCallback(() => {
    setShowBlockTypeModal(false);
    setPendingTopicGroupId(undefined);
    setEditBlockTypeContext(null);
  }, []);

  const handleBlockTypeSelect = useCallback((
    blockType: Block["type"],
    onCreateNewBlock: (blockType: Block["type"], topicGroupId?: string) => void,
  ) => {
    const newBlock = onCreateNewBlock(blockType, pendingTopicGroupId);

    // Reset modal state
    closeModal();

    return newBlock;
  }, [pendingTopicGroupId, closeModal]);

  const handleEditBlockTypeSelect = useCallback((
    newType: Block["type"],
    onChangeBlockType: (blockId: string, newType: Block["type"]) => void,
  ) => {
    if (editBlockTypeContext) {
      const { block } = editBlockTypeContext;
      onChangeBlockType(block.id, newType);
      closeModal();
    }
  }, [editBlockTypeContext, closeModal]);

  const getTopicGroupName = useCallback((topicGroups: TopicGroup[]): string => {
    if (pendingTopicGroupId) {
      const topicGroup = topicGroups.find((tg) =>
        tg.id === pendingTopicGroupId
      );
      return topicGroup?.name || "Main Discussion";
    }
    return "Main Discussion";
  }, [pendingTopicGroupId]);

  return {
    showBlockTypeModal,
    pendingTopicGroupId,
    editBlockTypeContext,
    openModalForNewBlock,
    openModalForEditBlock,
    closeModal,
    handleBlockTypeSelect,
    handleEditBlockTypeSelect,
    getTopicGroupName,
  };
}
