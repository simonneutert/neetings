# Architecture Overview

This guide helps new developers understand the core concepts and systems that power the Neetings JSX application. Read this first to get productive quickly.

## Core Concepts (3-minute read)

### 1. Blocks & Meetings
- **Meeting**: The main container that holds all data
- **Block**: Individual content items (11 types: Note, Q&A, Research, etc.)
- **Topic Groups**: Kanban columns that organize blocks
- **Attendees**: Global registry of people who attend meetings
- **Theme System**: Application-wide dark/light mode with system preference detection

### 2. SortKey-Based Ordering
Instead of array indices, we use lexicographic "sortKeys" to order blocks:
```
"a" < "ab" < "b" < "c"
```
This allows precise positioning between any two blocks without costly array operations.

**Example**: To insert between blocks with sortKeys "a" and "c":
```typescript
const newSortKey = generateSortKey("a", "c"); // Returns "b"
```

### 3. Dual Context Drag & Drop
Two separate drag contexts handle different operations:
- **Inter-column**: Moving blocks between topic groups
- **Intra-column**: Reordering blocks within the same topic group

## Component Map

```
App
├── Navigation (Contains ThemeToggle)
│   └── ThemeToggle (Theme switching component)
├── KanbanBoard (Main orchestrator)
│   ├── DndContext (Inter-column drags)
│   └── EnhancedTopicColumn (One per topic group)
│       ├── DndContext (Intra-column drags)
│       └── EnhancedSortableBlock (Drag wrapper)
│           └── UniversalBlock (Content renderer)
└── Hooks
    ├── useMeetingState (Main state + auto-save)
    ├── useTopicGroups (Topic group operations)
    ├── useGlobalAttendees (Attendee registry)
    └── useTheme (Theme state management)
```

## Data Flow

### Downward (Props)
```
Meeting Data → KanbanBoard → TopicColumn → SortableBlock → UniversalBlock
```

### Upward (State Updates)
```
Block Changes → onChange callbacks → useMeetingState → Auto-save queue → localStorage
```

### Drag Operations
```
Drag Start → DndContext → Calculate new position → Update sortKey → Re-render
```

## Key Systems Deep Dive

### SortKey System
**Location**: `src/utils/sortKeys.ts`

The sortKey system solves block ordering without array indices:

```typescript
// Generate sortKey for new block between two existing blocks
const sortKey = generateSortKey(beforeBlock?.sortKey, afterBlock?.sortKey);

// Always sort blocks before displaying
const sortedBlocks = blocks.sort(sortBySortKey);
```

**When to use**:
- Creating new blocks: Use `generateSortKey()`
- Drag operations: Use `calculateInsertSortKeyBetween()`
- Displaying blocks: Always call `sortBySortKey()`

### Drag & Drop System
**Location**: `src/components/KanbanBoard.tsx`

Two nested DndContext components handle different drag types:

```typescript
// Outer context: Inter-column (between topic groups)
<DndContext onDragEnd={handleInterColumnDragEnd}>
  {topicGroups.map(group => (
    <EnhancedTopicColumn key={group.id}>
      {/* Inner context: Intra-column (within topic group) */}
      <DndContext onDragEnd={handleIntraColumnDragEnd}>
        {blocks.map(block => (
          <EnhancedSortableBlock key={block.id} />
        ))}
      </DndContext>
    </EnhancedTopicColumn>
  ))}
</DndContext>
```

**Key patterns**:
- Inter-column: Change `topicGroupId`, append to end
- Intra-column: Update `sortKey` for precise positioning
- Always use block IDs, never array indices

### State Management
**Location**: `src/hooks/useMeetingState.ts`

The `useMeetingState` hook provides:
- Immediate UI updates
- Debounced localStorage persistence (500ms)
- Race condition handling via update queue

```typescript
const { meeting, updateMeeting } = useMeetingState();

// Always use updateMeeting for changes
updateMeeting(meeting => ({
  ...meeting,
  blocks: [...meeting.blocks, newBlock]
}));
```

### Schema Migration System
**Location**: `src/schemas/export.ts`, `src/schemas/migrations.ts`

Handles backward compatibility as data structures evolve:

```typescript
// Current version
export const CURRENT_EXPORT_VERSION = "1.0.0";

// Auto-migration on import
const migratedData = autoMigrate(importedData);
```

### Theme Management System
**Location**: `src/hooks/useTheme.ts`, `src/components/ThemeToggle.tsx`

Provides comprehensive dark/light mode switching with system preference detection:

```typescript
const { theme, setTheme, cycleTheme, effectiveTheme } = useTheme();

// Theme states: 'light', 'dark', 'system'
// effectiveTheme: resolved theme ('light' or 'dark')
```

**Key features**:
- System preference detection via `matchMedia('(prefers-color-scheme: dark)')`
- localStorage persistence for user preferences
- Bootstrap 5.3.6 integration using `data-bs-theme` attribute
- CSS custom properties for theme-aware styling
- Smooth transitions and professional visual polish

## Block Type System

**Location**: `src/types/Block.ts`

11 block types organized in semantic groups:
- **Documentation**: Note, Q&A, Research, Fact
- **Decision**: Decision, Issue  
- **Action**: TODO, Goal, Follow-up
- **Ideation**: Idea, Reference

Each type has:
- Specific fields and validation
- Semantic colors from Bootstrap
- Dynamic rendering in `UniversalBlock`

```typescript
// Create new block
const newBlock = createBlock(BlockType.Note, {
  title: "User Note",
  content: "As a user..."
});

// Access type configuration
const config = BLOCK_TYPES[BlockType.Note];
```

## Common Patterns

### Adding a New Block
```typescript
// 1. Generate sortKey for position
const sortKey = generateSortKey(beforeBlock?.sortKey, afterBlock?.sortKey);

// 2. Create block with proper fields
const newBlock = createBlock(BlockType.Note, {
  title: "New Note",
  sortKey,
  topicGroupId: currentTopicGroup.id
});

// 3. Update meeting state
updateMeeting(meeting => ({
  ...meeting,
  blocks: [...meeting.blocks, newBlock]
}));
```

### Handling Drag Operations
```typescript
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  
  if (!over) return;
  
  // Get the dragged block
  const draggedBlock = blocks.find(b => b.id === active.id);
  
  // Calculate new sortKey
  const newSortKey = calculateInsertSortKeyBetween(
    beforeBlock?.sortKey,
    afterBlock?.sortKey
  );
  
  // Update block position
  updateMeeting(meeting => ({
    ...meeting,
    blocks: meeting.blocks.map(block =>
      block.id === draggedBlock.id
        ? { ...block, sortKey: newSortKey }
        : block
    )
  }));
}
```

### Working with Topic Groups
```typescript
const { topicGroups, createTopicGroup, updateTopicGroup } = useTopicGroups();

// Create new topic group
const newGroup = createTopicGroup("New Column");

// Get blocks for a topic group
const groupBlocks = blocks
  .filter(block => block.topicGroupId === group.id)
  .sort(sortBySortKey);
```

### Working with Themes
```typescript
const { theme, effectiveTheme, setTheme, cycleTheme } = useTheme();

// Set specific theme
setTheme('dark');
setTheme('light');
setTheme('system');

// Cycle through themes
cycleTheme(); // light → dark → system → light

// Get current effective theme (resolved from system if needed)
const isDark = effectiveTheme === 'dark';

// Theme is automatically applied to document.documentElement
// via data-bs-theme attribute for Bootstrap integration
```

## Performance Considerations

### Auto-save Debouncing
State changes are debounced (500ms) to prevent excessive localStorage writes:

```typescript
// Multiple rapid updates are batched
updateMeeting(meeting => ({ ...meeting, title: "New Title" }));
updateMeeting(meeting => ({ ...meeting, description: "New Desc" }));
// Only saves once after 500ms
```

### SortKey Rebalancing
When sortKeys become too long, they're automatically rebalanced:

```typescript
// Automatic rebalancing when precision is lost
if (newSortKey.length > 10) {
  rebalanceSortKeys(blocks);
}
```

## Debugging Tips

### Drag & Drop Issues
- Check browser console for drag event data
- Verify block IDs are strings, not numbers
- Ensure sortKeys are properly generated

### State Management Issues
- Check localStorage in browser dev tools
- Verify `updateMeeting` is used instead of direct state mutation
- Look for race conditions with rapid updates

### SortKey Issues
- Verify blocks are sorted with `sortBySortKey()` before display
- Check for duplicate or missing sortKeys
- Ensure sortKeys are strings, not numbers

## Next Steps

1. **Make Your First Change**: See `FIRST_CHANGE_GUIDE.md`
2. **Run Tests**: `npm test` (should pass 196+ tests)
3. **Explore Components**: Start with `KanbanBoard.tsx` and work down
4. **Debug Setup**: Use VS Code with recommended extensions

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           KANBAN BOARD (Main Container)                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                    MAIN DND CONTEXT (Inter-Column)                          │ │
│  │                     - Cross-column drag detection                           │ │
│  │                     - Column drop target handling                           │ │
│  │                     - Block topic assignment                                │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  TOPIC COLUMN   │  │  TOPIC COLUMN   │  │  TOPIC COLUMN   │                   │
│  │   (Default)     │  │   (Group A)     │  │   (Group B)     │                   │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤                   │
│  │┌───────────────┐│  │┌───────────────┐│  │┌───────────────┐│                   │
│  ││ LOCAL DND     ││  ││ LOCAL DND     ││  ││ LOCAL DND     ││                   │
│  ││ CONTEXT       ││  ││ CONTEXT       ││  ││ CONTEXT       ││                   │
│  ││ (Intra-Column)││  ││ (Intra-Column)││  ││ (Intra-Column)││                   │
│  │└───────────────┘│  │└───────────────┘│  │└───────────────┘│                   │
│  │                 │  │                 │  │                 │                   │
│  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │                   │
│  │ │┌───────────┐│ │  │ │┌───────────┐│ │  │ │┌───────────┐│ │                   │
│  │ ││DROP ZONE  ││ │  │ ││DROP ZONE  ││ │  │ ││DROP ZONE  ││ │                   │
│  │ ││  (TOP)    ││ │  │ ││  (TOP)    ││ │  │ ││  (TOP)    ││ │                   │
│  │ │└───────────┘│ │  │ │└───────────┘│ │  │ │└───────────┘│ │                   │
│  │ │   BLOCK 1   │ │  │ │   BLOCK 4   │ │  │ │   BLOCK 7   │ │                   │
│  │ │ sortKey: a  │ │  │ │ sortKey: a  │ │  │ │ sortKey: a  │ │                   │
│  │ │┌───────────┐│ │  │ │┌───────────┐│ │  │ │┌───────────┐│ │                   │
│  │ ││DROP ZONE  ││ │  │ ││DROP ZONE  ││ │  │ ││DROP ZONE  ││ │                   │
│  │ ││ (BETWEEN) ││ │  │ ││ (BETWEEN) ││ │  │ ││ (BETWEEN) ││ │                   │
│  │ │└───────────┘│ │  │ │└───────────┘│ │  │ │└───────────┘│ │                   │
│  │ │   BLOCK 2   │ │  │ │   BLOCK 5   │ │  │ │   BLOCK 8   │ │                   │
│  │ │ sortKey: b  │ │  │ │ sortKey: b  │ │  │ │ sortKey: b  │ │                   │
│  │ │┌───────────┐│ │  │ │┌───────────┐│ │  │ │┌───────────┐│ │                   │
│  │ ││DROP ZONE  ││ │  │ ││DROP ZONE  ││ │  │ ││DROP ZONE  ││ │                   │
│  │ ││ (BETWEEN) ││ │  │ ││ (BETWEEN) ││ │  │ ││ (BETWEEN) ││ │                   │
│  │ │└───────────┘│ │  │ │└───────────┘│ │  │ │└───────────┘│ │                   │
│  │ │   BLOCK 3   │ │  │ │   BLOCK 6   │ │  │ │   BLOCK 9   │ │                   │
│  │ │ sortKey: c  │ │  │ │ sortKey: c  │ │  │ │ sortKey: c  │ │                   │
│  │ │┌───────────┐│ │  │ │┌───────────┐│ │  │ │┌───────────┐│ │                   │
│  │ ││DROP ZONE  ││ │  │ ││DROP ZONE  ││ │  │ ││DROP ZONE  ││ │                   │
│  │ ││ (BOTTOM)  ││ │  │ ││ (BOTTOM)  ││ │  │ ││ (BOTTOM)  ││ │                   │
│  │ │└───────────┘│ │  │ │└───────────┘│ │  │ │└───────────┘│ │                   │
│  │ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────┘ │                   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────────┘

DATA STRUCTURE:
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  MEETING                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│  blocks: [                                                                       │
│    { id: "1", content: "...", topicGroupId: null,     sortKey: "a" },           │
│    { id: "2", content: "...", topicGroupId: null,     sortKey: "b" },           │
│    { id: "3", content: "...", topicGroupId: null,     sortKey: "c" },           │
│    { id: "4", content: "...", topicGroupId: "group-a", sortKey: "a" },          │
│    { id: "5", content: "...", topicGroupId: "group-a", sortKey: "b" },          │
│    { id: "6", content: "...", topicGroupId: "group-a", sortKey: "c" },          │
│    { id: "7", content: "...", topicGroupId: "group-b", sortKey: "a" },          │
│    { id: "8", content: "...", topicGroupId: "group-b", sortKey: "b" },          │
│    { id: "9", content: "...", topicGroupId: "group-b", sortKey: "c" }           │
│  ],                                                                              │
│  topicGroups: [                                                                  │
│    { id: "group-a", name: "Topic A", color: "#ff6b6b" },                       │
│    { id: "group-b", name: "Topic B", color: "#4ecdc4" }                        │
│  ]                                                                               │
└─────────────────────────────────────────────────────────────────────────────────┘

DRAG OPERATION FLOW:
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              INTER-COLUMN DRAG                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  1. User drags Block 1 from Default to Topic A                                  │
│  2. Main DndContext detects cross-column movement                               │
│  3. Updates block: { ...block1, topicGroupId: "group-a", sortKey: "d" }        │
│  4. Block appears at end of Topic A column                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              INTRA-COLUMN DRAG                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  1. User drags Block 5 above Block 4 in Topic A                                │
│  2. Local DndContext in Topic A column detects movement                        │
│  3. Calculates new sortKey: "a5" (between "a" and "b")                         │
│  4. Updates block: { ...block5, sortKey: "a5" }                               │
│  5. Block 5 appears above Block 4 in sorted order                             │
└─────────────────────────────────────────────────────────────────────────────────┘

SORTKEY CALCULATION:
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            SORTKEY ALGORITHM                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Insert at beginning:     newSortKey = generateSortKey(null, firstSortKey)      │
│  Insert at end:           newSortKey = generateSortKey(lastSortKey, null)       │
│  Insert between:          newSortKey = generateSortKey(prevSortKey, nextSortKey)│
│  Rebalance when needed:   sortKeys = ["a", "b", "c", "d", ...]                 │
└─────────────────────────────────────────────────────────────────────────────────┘

COMPONENT HIERARCHY:
┌─────────────────────────────────────────────────────────────────────────────────┐
│  KanbanBoard                                                                    │
│  ├── DndContext (inter-column)                                                 │
│  │   ├── EnhancedTopicColumn (Default)                                         │
│  │   │   ├── DndContext (intra-column)                                         │
│  │   │   ├── SortableContext                                                   │
│  │   │   └── EnhancedSortableBlock[]                                           │
│  │   │       ├── DropIndicator (top)                                           │
│  │   │       ├── UniversalBlock                                                │
│  │   │       └── DropIndicator (bottom)                                        │
│  │   ├── EnhancedTopicColumn (Topic A)                                         │
│  │   └── EnhancedTopicColumn (Topic B)                                         │
│  └── DragOverlay                                                               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

This architecture provides:

1. **Dual Context System**: Separate drag contexts prevent conflicts between inter-column and intra-column operations
2. **SortKey-Based Ordering**: Lexicographic sortKeys allow precise control over block order within columns
3. **Visual Feedback**: Drop indicators show exactly where blocks will be placed
4. **Scalable Data Structure**: SortKey field integrates cleanly with existing block structure
5. **Backward Compatibility**: SortKey system maintains existing functionality while adding precise positioning

## Questions?

- Check existing tests for usage examples
- Look at similar components for patterns
- Refer to `CLAUDE.md` for detailed technical specifications