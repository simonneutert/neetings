# Schema Documentation v1.0.0

This document describes the current data format used by Neetings for export/import operations.

## Overview

**Version**: 1.0.0 (Current)  
**Format**: Structured JSON object with attendees, meetings, and metadata  
**File naming**: `neetings-all-YYYY-MM-DD.json`

## Top-Level Structure

The export file contains a structured JSON object with global attendees, meetings, and metadata. Here's the v1.0.0 format:

```json
{
  "version": "1.0.0",
  "exportedAt": "2025-06-18T10:30:00.000Z",
  "attendees": [
    {
      "id": "user-1",
      "name": "Demo User",
      "email": "user1@test.test",
      "created_at": "2025-06-15T08:00:00.000Z",
      "updated_at": "2025-06-15T08:00:00.000Z"
    }
  ],
  "meetings": [
    {
      "id": "meeting-1",
      "title": "Team Standup",
      "date": "2025-06-15",
      "startTime": "",
      "endTime": "",
      "blocks": [
        {
          "id": "block-1",
          "type": "textblock",
          "text": "Sprint progress update",
          "topicGroupId": null,
          "sortKey": "a0",
          "created_at": "2025-06-15T09:00:00.000Z"
        },
        {
          "id": "block-2", 
          "type": "todoblock",
          "todo": "Fix login bug",
          "completed": false,
          "topicGroupId": "topic-1",
          "sortKey": "b0",
          "created_at": "2025-06-15T09:05:00.000Z"
        }
      ],
      "topicGroups": [
        {
          "id": "topic-1",
          "name": "Demo Sidetopic",
          "color": "secondary",
          "order": 0,
          "meetingId": "meeting-1",
          "createdAt": "2025-06-15T08:35:00.000Z",
          "updatedAt": "2025-06-15T08:35:00.000Z"
        }
      ],
      "attendeeIds": ["user-1"],
      "created_at": "2025-06-15T08:30:00.000Z",
      "updated_at": "2025-06-15T09:10:00.000Z"
    }
  ],
  "metadata": {
    "appVersion": "1.0.0",
    "totalMeetings": 1,
    "totalAttendees": 1,
    "blockTypes": ["textblock", "todoblock"],
    "includesAttendees": true,
    "includesTopicGroups": true
  }
}
```

## Meeting Object Schema

Each meeting object has the following structure:

```typescript
interface Meeting {
  id: string;                    // UUID - unique meeting identifier
  title: string;                 // Meeting title (can be empty)
  date: string;                  // ISO date format (YYYY-MM-DD)
  startTime: string;             // Time string (can be empty)
  endTime: string;               // Time string (can be empty)
  blocks: Block[];               // Array of content blocks
  topicGroups?: TopicGroup[];    // Optional Kanban columns
  attendeeIds?: string[];        // References to global attendees
  created_at: string;            // ISO datetime string
  updated_at: string;            // ISO datetime string
}
```

### Example Meeting Object

```json
{
  "id": "70dbf151-1e15-4cd3-86f8-0275ac35580b",
  "title": "Sprint Planning Meeting",
  "date": "2025-06-15",
  "startTime": "09:00",
  "endTime": "10:30",
  "blocks": [
    {
      "id": "abc123",
      "type": "textblock",
      "text": "Review last sprint outcomes",
      "topicGroupId": null,
      "sortKey": "a0",
      "created_at": "2025-06-15T09:05:00.000Z"
    }
  ],
  "topicGroups": [],
  "attendeeIds": ["user1", "user2"],
  "created_at": "2025-06-15T08:00:00.000Z",
  "updated_at": "2025-06-15T10:30:00.000Z"
}
```

## Block Object Schema

Blocks are the core content units in meetings. Each block has a base structure plus type-specific fields:

```typescript
interface Block {
  id: string;                    // UUID - unique block identifier
  type: BlockType;               // One of 11 supported block types
  topicGroupId: string | null;   // Reference to topic group (null = default)
  sortKey: string;               // Lexicographic ordering key
  created_at: string;            // ISO datetime string
  completed?: boolean;           // For TODO blocks only
  
  // Type-specific content fields (one per block type)
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
  
  content?: Record<string, string>; // Legacy field (unused)
}
```

### Block Types

The application supports 11 specialized block types:

#### 📚 Documentation Blocks (Blue Theme)
- **`textblock`** - Stories and narrative content
  ```json
  {
    "type": "textblock",
    "text": "Meeting context and background information"
  }
  ```

- **`qandablock`** - Question and answer discussions
  ```json
  {
    "type": "qandablock", 
    "question": "How should we handle the API rate limiting?",
    "answer": "Implement exponential backoff with retry logic"
  }
  ```

- **`referenceblock`** - External links and resources
  ```json
  {
    "type": "referenceblock",
    "reference": "https://docs.api.com/rate-limiting"
  }
  ```

#### 💡 Ideation Blocks (Yellow Theme)
- **`factblock`** - Key data points and statistics
  ```json
  {
    "type": "factblock",
    "fact": "Current API response time averages 250ms"
  }
  ```

- **`ideablock`** - Creative concepts and suggestions
  ```json
  {
    "type": "ideablock",
    "idea": "Add caching layer to reduce API calls by 60%"
  }
  ```

- **`researchblock`** - Investigation topics with results
  ```json
  {
    "type": "researchblock",
    "topic": "Database optimization options",
    "result": "Indexing user_id column improved query speed by 40%"
  }
  ```

#### 🎯 Action Blocks (Orange Theme)
- **`todoblock`** - Actionable items with completion tracking
  ```json
  {
    "type": "todoblock",
    "todo": "Implement rate limiting middleware",
    "completed": false
  }
  ```

- **`followupblock`** - Next meeting actions
  ```json
  {
    "type": "followupblock",
    "followup": "Review implementation in next sprint planning"
  }
  ```

- **`goalblock`** - Strategic objectives
  ```json
  {
    "type": "goalblock",
    "goal": "Reduce API response time to under 200ms"
  }
  ```

#### ⚖️ Decision Blocks (Critical Colors)
- **`decisionblock`** - Final resolutions (Green)
  ```json
  {
    "type": "decisionblock",
    "decision": "Proceed with Redis caching implementation"
  }
  ```

- **`issueblock`** - Problems and blockers (Red)
  ```json
  {
    "type": "issueblock",
    "issue": "Redis server not available in staging environment"
  }
  ```

### Example Block Objects

```json
[
  {
    "id": "block1",
    "type": "textblock",
    "text": "Sprint planning session for Q2 features",
    "topicGroupId": null,
    "sortKey": "a0",
    "created_at": "2025-06-15T09:00:00.000Z"
  },
  {
    "id": "block2", 
    "type": "todoblock",
    "todo": "Set up development environment",
    "completed": true,
    "topicGroupId": "topic1",
    "sortKey": "b0",
    "created_at": "2025-06-15T09:15:00.000Z"
  },
  {
    "id": "block3",
    "type": "decisionblock", 
    "decision": "Use TypeScript for new features",
    "topicGroupId": "topic1",
    "sortKey": "c0",
    "created_at": "2025-06-15T09:30:00.000Z"
  }
]
```

## Topic Group Schema

Topic groups organize blocks into Kanban-style columns:

```typescript
interface TopicGroup {
  id: string;           // UUID - unique identifier
  name: string;         // Display name
  color?: string;       // Semantic color identifier  
  order: number;        // Display order (0-based)
  meetingId: string;    // Parent meeting reference
  createdAt: string;    // ISO datetime string
  updatedAt: string;    // ISO datetime string
}
```

### Example Topic Group

```json
{
  "id": "topic1",
  "name": "Technical Discussion", 
  "color": "primary",
  "order": 0,
  "meetingId": "70dbf151-1e15-4cd3-86f8-0275ac35580b",
  "createdAt": "2025-06-15T09:00:00.000Z",
  "updatedAt": "2025-06-15T09:00:00.000Z"
}
```

## Attendee Schema

Attendees represent meeting participants:

```typescript
interface Attendee {
  id: string;           // UUID - unique identifier
  name: string;         // Full name
  email?: string;       // Email address (optional)
  created_at: string;   // ISO datetime string
  updated_at: string;   // ISO datetime string
}
```

### Example Attendee

```json
{
  "id": "8ee21d4b-5cc6-4680-94af-dfdb00c58a71",
  "name": "John Doe",
  "email": "john.doe@company.com", 
  "created_at": "2025-06-15T08:00:00.000Z",
  "updated_at": "2025-06-15T08:00:00.000Z"
}
```

## Data Relationships

### Block Ordering
- Blocks are ordered using lexicographic `sortKey` values
- Keys like `"a0"`, `"a1"`, `"b0"` provide sortable order
- Allows precise positioning between existing blocks

### Topic Group Assignment
- `block.topicGroupId = null` → Default column (List view)
- `block.topicGroupId = "uuid"` → Assigned to specific topic group
- Topic groups must exist in the same meeting

### Attendee References
- **Current**: `meeting.attendeeIds[]` contains attendee UUIDs
- **Legacy**: `meeting.attendees[]` contains full attendee objects (deprecated)

## Validation Rules

### Required Fields
- All objects must have `id`, `created_at`
- Meetings must have `title`, `date`, `blocks[]`
- Blocks must have `type`, `sortKey`, `topicGroupId`
- Topic groups must have `name`, `order`, `meetingId`

### Data Integrity
- Block `topicGroupId` must reference existing topic group or be `null`
- Topic group `meetingId` must match parent meeting
- Attendee references in `attendeeIds` should exist in global registry

### Type-Specific Requirements
- TODO blocks can have `completed` boolean
- Q&A blocks should have `question`, optionally `answer`
- Each block type uses its corresponding content field

## Complete Example Export

```json
{
  "version": "1.0.0",
  "exportedAt": "2025-06-18T10:30:00.000Z",
  "attendees": [
    {
      "id": "user1",
      "name": "Alice Smith",
      "email": "alice@example.com",
      "created_at": "2025-06-15T08:00:00.000Z",
      "updated_at": "2025-06-15T08:00:00.000Z"
    },
    {
      "id": "user2",
      "name": "Bob Jones",
      "created_at": "2025-06-15T08:15:00.000Z",
      "updated_at": "2025-06-15T08:15:00.000Z"
    }
  ],
  "meetings": [
    {
      "id": "meeting1",
      "title": "Sprint Planning",
      "date": "2025-06-15", 
      "startTime": "09:00",
      "endTime": "10:30",
      "blocks": [
        {
          "id": "block1",
          "type": "textblock",
          "text": "Sprint goals discussion",
          "topicGroupId": null,
          "sortKey": "a0",
          "created_at": "2025-06-15T09:00:00.000Z"
        },
        {
          "id": "block2",
          "type": "todoblock", 
          "todo": "Set up CI/CD pipeline",
          "completed": false,
          "topicGroupId": "topic1",
          "sortKey": "b0",
          "created_at": "2025-06-15T09:15:00.000Z"
        }
      ],
      "topicGroups": [
        {
          "id": "topic1",
          "name": "Action Items",
          "color": "success",
          "order": 0,
          "meetingId": "meeting1",
          "createdAt": "2025-06-15T09:00:00.000Z",
          "updatedAt": "2025-06-15T09:00:00.000Z"
        }
      ],
      "attendeeIds": ["user1", "user2"],
      "created_at": "2025-06-15T08:00:00.000Z",
      "updated_at": "2025-06-15T10:30:00.000Z"
    }
  ],
  "metadata": {
    "appVersion": "1.0.0",
    "totalMeetings": 1,
    "totalAttendees": 2,
    "blockTypes": ["textblock", "todoblock"],
    "includesAttendees": true,
    "includesTopicGroups": true
  }
}
```

## Migration Notes

This v1.0.0 format will be automatically upgraded to future schema versions when imported. The application includes migration infrastructure to handle:

- Schema evolution (v1→v2, v2→v3, etc.)
- Data validation and normalization  
- Backward compatibility preservation
- Error handling and rollback capabilities

For details on schema migration, see [MIGRATION.md](./MIGRATION.md).