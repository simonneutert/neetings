# API Reference

This document provides comprehensive technical specifications for the Neetings application data structures, schemas, and APIs.

## 📋 Block Type System

The application supports 11 block types organized into 4 semantic groups:

### Documentation Group (Blue Theme)
```typescript
// Note block - Narrative content and context
textblock: {
  label: "Note",
  color: "doc-dark",
  fields: ["text"]
}

// Q&A block - Structured questions and answers
qandablock: {
  label: "Q&A", 
  color: "doc-medium",
  fields: ["question", "answer"]
}

// Reference block - External links and resources
referenceblock: {
  label: "Reference",
  color: "doc-light", 
  fields: ["reference"]
}
```

### Ideation Group (Yellow Theme)
```typescript
// Fact block - Key data points and statistics
factblock: {
  label: "Fact",
  color: "idea-medium",
  fields: ["fact"]
}

// Idea block - Creative concepts and suggestions
ideablock: {
  label: "Idea",
  color: "idea-dark",
  fields: ["idea"]
}

// Research block - Investigation topics with results
researchblock: {
  label: "Research",
  color: "idea-light",
  fields: ["topic", "result"]
}
```

### Action Group (Orange Theme)
```typescript
// TODO block - Actionable items with completion tracking
todoblock: {
  label: "TODO",
  color: "action-dark",
  fields: ["todo"]
}

// Follow-up block - Next meeting actions
followupblock: {
  label: "Follow-up",
  color: "action-light",
  fields: ["followup"]
}

// Goal block - Strategic objectives and targets
goalblock: {
  label: "Goal",
  color: "action-medium",
  fields: ["goal"]
}
```

### Decision Group (Critical Colors)
```typescript
// Decision block - Final resolutions and outcomes
decisionblock: {
  label: "Decision",
  color: "decision-success",
  fields: ["decision"]
}

// Issue block - Problems and blockers requiring attention
issueblock: {
  label: "Issue",
  color: "decision-danger",
  fields: ["issue"]
}
```

## 🗃️ Core Data Structures

### Block Interface
```typescript
interface Block {
  id: string;                    // Unique identifier
  type: BlockType;               // One of the 11 block types
  created_at: string;            // ISO timestamp
  sortKey: string;               // Lexicographic ordering key
  topicGroupId: string | null;   // null = default group
  completed?: boolean;           // For TODO blocks
  
  // Block-specific fields (based on type)
  text?: string;                 // textblock
  question?: string;             // qandablock
  answer?: string;               // qandablock
  topic?: string;                // researchblock
  result?: string;               // researchblock
  fact?: string;                 // factblock
  decision?: string;             // decisionblock
  issue?: string;                // issueblock
  todo?: string;                 // todoblock
  goal?: string;                 // goalblock
  followup?: string;             // followupblock
  idea?: string;                 // ideablock
  reference?: string;            // referenceblock
}
```

### Meeting Interface
```typescript
interface Meeting {
  id: string;
  title: string;
  date: string;                  // ISO date string
  time: string;                  // HH:MM format
  attendeeIds: string[];         // References to attendee IDs
  blocks: Block[];
  topicGroups: TopicGroup[];
  created_at: string;
  updated_at: string;
}
```

### TopicGroup Interface
```typescript
interface TopicGroup {
  id: string;
  name: string;
  color: string;                 // Hex color code
  created_at: string;
}
```

### Attendee Interface
```typescript
interface Attendee {
  id: string;
  name: string;
  email?: string;                // Optional for flexibility
  created_at: string;
}
```

## 🎨 Color System

### Semantic Colors
The application uses Bootstrap-inspired semantic colors:

```typescript
type SemanticColor = 
  // Documentation colors (Blue shades)
  | "doc-dark"       // #0d47a1
  | "doc-medium"     // #1976d2  
  | "doc-light"      // #42a5f5
  
  // Ideation colors (Yellow shades)
  | "idea-dark"      // #f57f17
  | "idea-medium"    // #fbc02d
  | "idea-light"     // #fff176
  
  // Action colors (Orange shades)  
  | "action-dark"    // #e65100
  | "action-medium"  // #ff9800
  | "action-light"   // #ffb74d
  
  // Decision colors (Critical)
  | "decision-success"  // #2e7d32 (green)
  | "decision-danger"   // #d32f2f (red)
  | "decision-warning"  // #f57c00 (orange)
```

## 🔑 SortKey System

### Purpose
SortKeys enable precise block ordering without array index dependencies, crucial for the dual-context drag & drop system.

### Format
```typescript
// Lexicographic ordering examples
"a" < "ab" < "b" < "c" < "d"
"a" < "a0" < "a1" < "a5" < "b"
```

### Key Functions
```typescript
// Generate sortKey between two existing keys
function generateSortKey(before?: string, after?: string): string

// Sort array of items by sortKey
function sortBySortKey<T extends { sortKey: string }>(items: T[]): T[]

// Calculate insertion position for drag operations
function calculateInsertSortKeyBetween(beforeKey?: string, afterKey?: string): string
```

## 📄 Export Schema (v1.0.0)

### Current Export Format
```typescript
interface ExportV1 {
  version: "1.0.0";
  exportedAt: string;            // ISO timestamp
  attendees: Attendee[];
  meetings: Meeting[];
  metadata: {
    appVersion: string;
    totalMeetings: number;
    totalAttendees: number;
    blockTypes: string[];        // Unique block types in export
    includesAttendees: boolean;
    includesTopicGroups: boolean;
  };
}
```

### Legacy Format Support
```typescript
// Legacy format (pre-v1.0.0)
type LegacyExport = Meeting[];   // Simple array of meetings

// Automatic migration available
function migrateLegacyToV1(legacyData: LegacyExport): ExportV1
```

## 🪝 Core Hooks

### useMeetingState
Main state management hook with auto-save functionality.

```typescript
function useMeetingState() {
  return {
    meeting: Meeting | null;
    updateMeeting: (updater: (prev: Meeting) => Meeting) => void;
    isSaving: boolean;
    lastSaved: Date | null;
  };
}
```

### useTopicGroups
Topic group management operations.

```typescript
function useTopicGroups() {
  return {
    topicGroups: TopicGroup[];
    createTopicGroup: (name: string, color?: string) => TopicGroup;
    updateTopicGroup: (id: string, updates: Partial<TopicGroup>) => void;
    deleteTopicGroup: (id: string) => void;
  };
}
```

### useGlobalAttendees
Global attendee registry management.

```typescript
function useGlobalAttendees() {
  return {
    attendees: Attendee[];
    addAttendee: (name: string, email?: string) => Attendee;
    updateAttendee: (id: string, updates: Partial<Attendee>) => void;
    deleteAttendee: (id: string) => void;
    searchAttendees: (query: string) => Attendee[];
  };
}
```

## 🎯 Block Creation API

### Creating Blocks
```typescript
// Create a new block with proper defaults
function createBlock(
  type: Block["type"], 
  topicGroupId: string | null = null, 
  sortKey?: string
): Block

// Example usage
const newNote = createBlock("textblock", null, generateSortKey());
const newTodo = createBlock("todoblock", "topic-group-id");
```

### Block Type Configuration
```typescript
// Access block type metadata
const config = BLOCK_TYPES[blockType];
console.log(config.label);    // "Note"
console.log(config.fields);   // ["text"]
console.log(config.color);    // "doc-dark"
```

## 🔄 Migration System

### Version Detection
```typescript
function detectExportVersion(data: unknown): string
```

### Migration Chain
```typescript
// Migration plans define upgrade paths
interface MigrationPlan {
  fromVersion: string;
  toVersion: string;
  description: string;
  transform: (data: any) => any;
  validate: (data: any) => boolean;
  rollback: (data: any) => any;
}
```

### Auto-Migration
```typescript
// Automatically migrates to latest version
function autoMigrate(data: unknown): ExportV1
```

## 📊 Performance Constants

```typescript
// Auto-save debounce delay
APP_CONFIG.AUTO_SAVE_DELAY = 500; // milliseconds

// Search debounce delay  
APP_CONFIG.SEARCH_DEBOUNCE = 500; // milliseconds

// SortKey rebalancing threshold
SORTKEY_REBALANCE_THRESHOLD = 10; // characters
```

## 🔍 Validation Schemas

All data structures are validated using Zod schemas:

```typescript
// Block validation
const BlockSchema = z.object({
  id: z.string(),
  type: z.enum([...BLOCK_TYPES]),
  sortKey: z.string(),
  // ... additional fields
});

// Export validation
const ExportV1Schema = z.object({
  version: z.literal("1.0.0"),
  exportedAt: z.string().datetime(),
  // ... additional fields
});
```

## 🧪 Testing Utilities

### Test Helpers
```typescript
// Create test block
function createTestBlock(overrides?: Partial<Block>): Block

// Create test meeting
function createTestMeeting(overrides?: Partial<Meeting>): Meeting

// Create test attendee
function createTestAttendee(overrides?: Partial<Attendee>): Attendee
```

### Mock Data
Comprehensive mock data available in `/src/test/` directory for all major data structures.

---

This API reference covers all major interfaces and functions in the Neetings codebase. For implementation details and architectural patterns, see [ARCHITECTURE.md](./ARCHITECTURE.md).