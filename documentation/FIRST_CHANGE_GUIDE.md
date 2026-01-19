# Making Your First Change

This guide walks you through common tasks that new developers typically need to do. Follow these step-by-step examples to get comfortable with the codebase.

## Before You Start

1. **[Read Getting Started Guide](./GETTING_STARTED.md)** - Set up your development environment (5 minutes)
2. **[Read Architecture Guide](./ARCHITECTURE.md)** - Understand the core concepts (10 minutes)
3. **Run the tests** - `npm test` should pass 196+ tests
4. **Start development** - `npm run dev` to see the app running

## Task 1: Add a New Field to an Existing Block Type

Let's add a "priority" field to the textblock (Note) type.

### Step 1: Update the Block Type Configuration

**File**: `src/types/Block.ts`

Find the textblock configuration and add the priority field:

```typescript
// Find this section around line 41-45
textblock: {
  label: "Note",
  color: "doc-dark" as SemanticColor,
  fields: ["text", "priority"],  // ← Add "priority" here
},
```

### Step 2: Update the Block Interface

**File**: `src/types/Block.ts`

Add the priority field to the Block interface:

```typescript
// Around line 19, add this field
export interface Block {
  id: string;
  type: "textblock" | "qandablock" | "researchblock" | /* ... other types */;
  text?: string;
  priority?: string;  // ← Add this line
  question?: string;
  // ... rest of fields
}
```

### Step 3: Update the Block Creation Function

**File**: `src/types/Block.ts`

The `createBlock` function will automatically handle the new field since it uses the fields array from `BLOCK_TYPES`. No changes needed here.

### Step 4: Update the Form Rendering

**File**: `src/components/UniversalBlock.tsx`

The form rendering is automatically handled by the generic field system. Since we added "priority" to the fields array, it will automatically render an input field. If you want a dropdown instead of a text input, you can customize the `renderField` function.

### Step 5: Test Your Changes

```bash
# Run tests to make sure nothing broke
npm test

# Start the app and test manually
npm run dev
```

**Manual test steps**:
1. Create a new Note block
2. Verify the Priority field appears
3. Enter a priority value and save
4. Refresh the page and verify the priority persists

---

## Task 2: Add a New Block Type

Let's create a "riskblock" type for tracking project risks.

### Step 1: Add to Block Type Union

**File**: `src/types/Block.ts`

```typescript
// Find the Block interface around line 7-18
export interface Block {
  id: string;
  type:
    | "textblock"
    | "qandablock"
    | "researchblock"
    | "factblock"
    | "decisionblock"
    | "issueblock"
    | "todoblock"
    | "goalblock"
    | "followupblock"
    | "ideablock"
    | "referenceblock"
    | "riskblock";  // ← Add this line
  // ... existing fields
  risk?: string;      // ← Add this field
  // ... rest of interface
}
```

### Step 2: Add Block Configuration

**File**: `src/types/Block.ts`

```typescript
// Find BLOCK_TYPES around line 92 (Decision Group) and add:
  riskblock: {
    label: "Risk",
    color: "decision-warning" as SemanticColor,
    fields: ["risk"],
  },
  // ... existing decision blocks
```

### Step 3: Update Block Groups

**File**: `src/components/BlockTypeModal.tsx`

Find the blockGroups configuration and add the risk block to the Decision group:

```typescript
// Find the Decision group configuration
{
  name: "Decision",
  types: ["decisionblock", "issueblock", "riskblock"],  // ← Add "riskblock"
  icon: "⚖️",
  description: "Final decisions and critical issues"
}
```

### Step 4: Test the New Block Type

```bash
# Run tests first
npm test

# Start development
npm run dev
```

**Manual test steps**:
1. Click "+ Add New Block"
2. Look for "Risk" in the Decision group
3. Create a Risk block and fill out the risk field
4. Save and verify it appears in the Kanban board
5. Test drag and drop functionality

---

## Task 3: Customize Export Formatting

Let's customize how risk blocks appear in exported documents.

### Step 1: Update Export Transformer

**File**: `src/utils/export/transformers/MarkdownTransformer.ts`

Add special formatting for Risk blocks:

```typescript
// Find the formatBlockFromData method and add a case for risk:
private formatBlockFromData(blockData: any): string {
  const { type, ...fields } = blockData;
  
  switch (type) {
    // ... existing cases
    
    case 'riskblock':
      return [
        `## ⚠️ Risk: ${fields.risk}`,
        '',
        '**Risk Level**: High/Medium/Low (to be assessed)',
        ''
      ].join('\n');
      
    // ... rest of cases
  }
}
```

---

## Common Patterns & Tips

### Working with SortKeys
```typescript
// Always generate sortKeys when creating new blocks
const newSortKey = generateSortKey(beforeBlock?.sortKey, afterBlock?.sortKey);

// Always sort blocks before displaying
const sortedBlocks = blocks
  .filter(block => block.topicGroupId === groupId)
  .sort(sortBySortKey);
```

### State Updates
```typescript
// ALWAYS use updateMeeting, never mutate directly
updateMeeting(meeting => ({
  ...meeting,
  blocks: [...meeting.blocks, newBlock]
}));

// DON'T do this:
meeting.blocks.push(newBlock); // ❌ Will cause data loss
```

### Block Type Validation
```typescript
// Use the BLOCK_TYPES constant for field validation
const allowedFields = BLOCK_TYPES[block.type].fields;
const isValidField = allowedFields.includes(fieldName);
```

### Error Handling
```typescript
// Always check for required data before operations
if (!block || !block.id) {
  console.error('Invalid block data');
  return;
}
```

## Testing Your Changes

### Run the Full Test Suite
```bash
npm test        # Run all tests
npm run test:coverage  # Check coverage
```

### Manual Testing Checklist
- [ ] Create blocks of your new type
- [ ] Drag blocks between columns
- [ ] Edit block content and save
- [ ] Export and verify formatting
- [ ] Refresh page and verify persistence
- [ ] Test with multiple topic groups

### Debugging Tips

**Console Debugging:**
- Check browser console for errors
- Look for drag event logs in KanbanBoard
- Verify localStorage data in Application tab

**Common Issues:**
- **Blocks not saving**: Check if `updateMeeting` is called
- **Drag not working**: Verify block IDs are strings
- **Export errors**: Check block field definitions
- **Sorting issues**: Ensure `sortBySortKey` is called

## Understanding the Block System

### Current Block Types (11 total)

**Documentation Group** (Blue theme):
- `textblock` (Note) - Field: `text`
- `qandablock` (Q&A) - Fields: `question`, `answer`
- `referenceblock` (Reference) - Field: `reference`

**Ideation Group** (Yellow theme):
- `factblock` (Fact) - Field: `fact`
- `ideablock` (Idea) - Field: `idea`
- `researchblock` (Research) - Fields: `topic`, `result`

**Action Group** (Orange theme):
- `todoblock` (TODO) - Field: `todo`
- `followupblock` (Follow-up) - Field: `followup`
- `goalblock` (Goal) - Field: `goal`

**Decision Group** (Critical colors):
- `decisionblock` (Decision) - Field: `decision`
- `issueblock` (Issue) - Field: `issue`

### How the System Works

1. **Field-Based Rendering**: Each block type defines which fields it uses
2. **Automatic Form Generation**: The `UniversalBlock` component automatically renders form fields
3. **Type Safety**: TypeScript ensures only valid fields are used
4. **Consistent Styling**: Semantic colors provide consistent theming

## Next Steps

1. **Read the tests** - Look at existing tests for patterns
2. **Explore components** - Study how similar features are implemented  
3. **Ask questions** - Check CLAUDE.md for detailed specifications
4. **Contribute back** - Consider documenting patterns you discover

## Getting Help

- **Architecture questions**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Development practices**: See [DEVELOPMENT.md](./DEVELOPMENT.md)  
- **Technical specifications**: See [API_REFERENCE.md](./API_REFERENCE.md)
- **Examples**: Look at existing tests and components
- **Debugging**: Use browser dev tools and console logs