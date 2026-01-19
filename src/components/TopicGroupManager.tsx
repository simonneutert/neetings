import { FunctionalComponent } from "preact";
import { memo } from "preact/compat";
import { useState } from "preact/hooks";
import { TopicGroup } from "../types/TopicGroup";
import { TOPIC_GROUP_COLORS } from "../utils/colors";
import { useTranslation } from "../i18n/index";

interface TopicGroupManagerProps {
  meetingId: string;
  topicGroups: TopicGroup[];
  onCreateTopic: (name: string, color?: string) => void;
  onUpdateTopic: (topicGroup: TopicGroup, updates: Partial<TopicGroup>) => void;
  onDeleteTopic: (topicGroupId: string) => void;
  onSwapTopic?: (topicGroupId: string, direction: "left" | "right") => void;
  onTopicGroupSelect?: (topicGroupId: string) => void;
}

// Color picker component (memoized)
const ColorPickerComponent = ({
  selectedColor,
  onColorChange,
}: {
  selectedColor: string;
  onColorChange: (color: string) => void;
}) => {
  const { t } = useTranslation();
  return (
    <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
      {TOPIC_GROUP_COLORS.map((color) => (
        <button
          key={color.hex}
          type="button"
          onClick={() => onColorChange(color.hex)}
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            border: selectedColor === color.hex
              ? "2px solid #000"
              : "1px solid #ccc",
            backgroundColor: color.hex,
            cursor: "pointer",
            padding: 0,
          }}
          title={t(`colors.colorName.${color.name.toLowerCase()}`)}
          aria-label={t(`colors.colorName.${color.name.toLowerCase()}`)}
        />
      ))}
    </div>
  );
};

const ColorPicker = memo(ColorPickerComponent);

const TopicGroupManagerComponent: FunctionalComponent<TopicGroupManagerProps> =
  ({
    meetingId: _meetingId,
    topicGroups,
    onCreateTopic,
    onUpdateTopic,
    onDeleteTopic,
    onSwapTopic,
    onTopicGroupSelect,
  }) => {
    const { t } = useTranslation();
    const [isAddingTopic, setIsAddingTopic] = useState(false);
    const [newTopicName, setNewTopicName] = useState("");
    const [newTopicColor, setNewTopicColor] = useState<string>(
      TOPIC_GROUP_COLORS[0].hex,
    );
    const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [editingColor, setEditingColor] = useState<string>("");

    // Sort topic groups by order for display
    const sortedTopicGroups = [...topicGroups].sort((a, b) => a.order - b.order);

    const handleCreateTopic = () => {
      if (newTopicName.trim()) {
        onCreateTopic(newTopicName.trim(), newTopicColor);
        setNewTopicName("");
        setNewTopicColor(TOPIC_GROUP_COLORS[0].hex);
        setIsAddingTopic(false);
      }
    };

    const handleStartEdit = (topic: TopicGroup) => {
      setEditingTopicId(topic.id);
      setEditingName(topic.name);
      setEditingColor(topic.color || TOPIC_GROUP_COLORS[0].hex);
    };

    const handleSaveEdit = (topic: TopicGroup) => {
      const updates: Partial<TopicGroup> = {};
      if (editingName.trim() && editingName !== topic.name) {
        updates.name = editingName.trim();
      }
      if (editingColor !== topic.color) {
        updates.color = editingColor;
      }
      if (Object.keys(updates).length > 0) {
        onUpdateTopic(topic, updates);
      }
      setEditingTopicId(null);
      setEditingName("");
      setEditingColor("");
    };

    const handleCancelEdit = () => {
      setEditingTopicId(null);
      setEditingName("");
      setEditingColor("");
    };

    const handleDeleteTopic = (topicGroup: TopicGroup) => {
      if (
        window.confirm(
          t("topics.topicGroupManager.confirmDelete", {
            topicName: topicGroup.name,
          }),
        )
      ) {
        onDeleteTopic(topicGroup.id);
      }
    };

    return (
      <div style={{ marginBottom: "1rem" }}>
        {/* Topic Groups List */}
        {topicGroups.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            <h6
              style={{
                fontSize: "0.9rem",
                color: "#6c757d",
                marginBottom: "0.5rem",
              }}
            >
              {t("topics.topicGroupManager.title")} ({topicGroups.length})
            </h6>
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {/* Button to navigate to Main Agenda / Default Column */}
              <button
                onClick={() =>
                  onTopicGroupSelect && onTopicGroupSelect("default")} // "default" or null for the main/ungrouped column
                style={{
                  padding: "0.25rem 0.5rem",
                  backgroundColor: "#f8f9fa", // A neutral background
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                  border: "1px solid #dee2e6",
                  cursor: "pointer",
                  color: "#212529",
                }}
                title={t("topics.tooltips.navigateToMainAgenda")}
              >
                {t("topics.labels.mainAgenda")}
              </button>
              {sortedTopicGroups.map((topic, index) => (
                <div
                  key={topic.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    padding: "0.25rem 0.5rem",
                    backgroundColor: topic.color || "#e9ecef",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    border: "1px solid #dee2e6",
                  }}
                >
                  {editingTopicId === topic.id
                    ? (
                      <>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) =>
                            setEditingName(
                              (e.target as HTMLInputElement).value,
                            )}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(topic);
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                          style={{
                            border: "none",
                            background: "transparent",
                            fontSize: "0.8rem",
                            width: "80px",
                            outline: "none",
                          }}
                          autoFocus
                        />
                        <ColorPicker
                          selectedColor={editingColor}
                          onColorChange={setEditingColor}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(topic)}
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            padding: "0 2px",
                            fontSize: "0.7rem",
                          }}
                          title={t("common.save")}
                          aria-label={t("common.save")}
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            padding: "0 2px",
                            fontSize: "0.7rem",
                          }}
                          title={t("common.cancel")}
                          aria-label={t("common.cancel")}
                        >
                          ✕
                        </button>
                      </>
                    )
                    : (
                      <>
                        {/* Move Left Button */}
                        {onSwapTopic && index > 0 && (
                          <button
                            type="button"
                            onClick={() => onSwapTopic(topic.id, "left")}
                            style={{
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              padding: "0 2px",
                              fontSize: "0.7rem",
                              opacity: 0.7,
                            }}
                            title={t("topics.tooltips.moveLeft")}
                            aria-label={t("topics.tooltips.moveLeft")}
                          >
                            ◀
                          </button>
                        )}
                        {/* Move Right Button */}
                        {onSwapTopic && index < sortedTopicGroups.length - 1 && (
                          <button
                            type="button"
                            onClick={() => onSwapTopic(topic.id, "right")}
                            style={{
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              padding: "0 2px",
                              fontSize: "0.7rem",
                              opacity: 0.7,
                            }}
                            title={t("topics.tooltips.moveRight")}
                            aria-label={t("topics.tooltips.moveRight")}
                          >
                            ▶
                          </button>
                        )}
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => onTopicGroupSelect && onTopicGroupSelect(topic.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              if (e.key === " ") {
                                e.preventDefault();
                              }
                              onTopicGroupSelect && onTopicGroupSelect(topic.id);
                            }
                          }}
                          style={{
                            cursor: "pointer",
                            minWidth: "50px",
                          }}
                          aria-label={topic.name}
                        >
                          {topic.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(topic)}
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            padding: "0 2px",
                            fontSize: "0.7rem",
                            opacity: 0.7,
                          }}
                          title={t("topics.topicGroupManager.editGroupButton")}
                          aria-label={t("topics.topicGroupManager.editGroupButton")}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTopic(topic)}
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            padding: "0 2px",
                            fontSize: "0.7rem",
                            opacity: 0.7,
                          }}
                          title={t(
                            "topics.topicGroupManager.deleteGroupButton",
                          )}
                          aria-label={t(
                            "topics.topicGroupManager.deleteGroupButton",
                          )}
                        >
                          🗑️
                        </button>
                      </>
                    )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Topic */}
        {isAddingTopic
          ? (
            <div
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              <input
                type="text"
                value={newTopicName}
                onChange={(e) =>
                  setNewTopicName((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTopic();
                  if (e.key === "Escape") {
                    setIsAddingTopic(false);
                    setNewTopicName("");
                  }
                }}
                placeholder={t("topics.topicGroupManager.topicNamePlaceholder")}
                style={{
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.8rem",
                  border: "1px solid #dee2e6",
                  borderRadius: "4px",
                  flex: 1,
                  maxWidth: "200px",
                }}
                autoFocus
              />
              <ColorPicker
                selectedColor={newTopicColor}
                onColorChange={setNewTopicColor}
              />
              <button
                onClick={handleCreateTopic}
                className="btn btn-sm btn-success"
                style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
                disabled={!newTopicName.trim()}
              >
                {t("topics.labels.createGroupButton")}
              </button>
              <button
                onClick={() => {
                  setIsAddingTopic(false);
                  setNewTopicName("");
                }}
                className="btn btn-sm btn-outline-secondary"
                style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
              >
                {t("common.cancel")}
              </button>
            </div>
          )
          : (
            <button
              onClick={() => setIsAddingTopic(true)}
              className="btn btn-sm btn-outline-primary"
              style={{ fontSize: "0.8rem", padding: "0.25rem 0.75rem" }}
            >
              + {t("topics.topicGroupManager.addGroupButton")}
            </button>
          )}
      </div>
    );
  };

export const TopicGroupManager = memo(TopicGroupManagerComponent);
