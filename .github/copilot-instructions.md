# GitHub Copilot Instructions for Neetings

This file provides GitHub Copilot with context-aware guidance for working on the Neetings codebase.

## Project Overview

**Neetings** is a modern meeting management platform that runs 100% in the browser with zero backend complexity. It transforms chaotic meeting notes into organized, actionable outcomes using intelligent block-based organization, visual Kanban management, and smart attendee tracking.

### Key Features
- **11 Smart Block Types**: Specialized content blocks (Note, Q&A, Research, TODO, Decision, etc.)
- **Dual View System**: List view for linear note-taking, Kanban view for visual organization
- **Local-First Architecture**: All data stored in browser localStorage - no backend servers
- **Full Data Portability**: Export to Markdown, RTF, DOCX, HTML, and JSON formats
- **Smart Attendee System**: Global registry with autocomplete and flexible email handling

## Technical Stack

### Core Technologies
- **Preact 10.27+**: Fast 3kB React alternative for component architecture
- **TypeScript 5.9+**: Strict mode enabled for type safety
- **Vite 7.1+**: Next-generation frontend build tooling
- **Vitest 3.2+**: Fast unit test framework (347+ test cases)
- **Zod 4.1+**: TypeScript-first schema validation for exports/imports

### UI & Interactions
- **@dnd-kit**: Modern drag and drop for Kanban functionality
- **Bootstrap 5.3.6**: Responsive design system with native dark mode
- **Testing Library**: Component and integration testing utilities

### Development Tools
- **ESLint**: Preact-specific rules with TypeScript support
- **JSDOM**: DOM implementation for test environments

## Architecture Principles

### Data Model Hierarchy
```
Meeting (top-level container)
├── Blocks (11 types with content, metadata, sortKey)
│   └── Organized by Topic Groups
├── Topic Groups (Kanban columns)
│   └── Main Agenda (always first) + custom groups
└── Attendees (global registry, referenced by ID)
```

### SortKey-Based Ordering System
- **Never use array indices** for block positioning
- Blocks use lexicographic `sortKey` field (e.g., "a0", "a1", "b0")
- Use `generateSortKey(beforeKey, afterKey)` for new positions
- Always sort blocks with `sortBySortKey()` before display
- Rebalance sortKeys when precision becomes insufficient

**Example:**
```typescript
import { generateSortKey, sortBySortKey } from './utils/sortKeys';

// Insert between two blocks
const newBlock = {
  ...blockData,
  sortKey: generateSortKey(prevBlock?.sortKey, nextBlock?.sortKey)
};

// Display blocks
const sortedBlocks = blocks.sort(sortBySortKey);
```

### State Management
- **Primary Hook**: `useMeetingState` - main state with auto-save (500ms delay)
- **Auto-save**: Triggered by `APP_CONFIG.AUTO_SAVE_DELAY` after state updates
- **Persistence**: localStorage with automatic backups
- **Theme**: `useTheme` hook for dark/light mode with system preference detection

### Drag & Drop Implementation
Two separate DndContext layers handle different operations:

1. **Inter-column**: Moving blocks between topic groups
   - Change `topicGroupId` and append to target column
   
2. **Intra-column**: Reordering blocks within same topic group
   - Update `sortKey` field using sortKey utilities

**Always use block IDs for identification, never array indices**

## Code Style & Standards

### TypeScript
- **Strict mode enabled**: No implicit any, strict null checks
- **Semantic imports**: Use `src/` directory imports
- **Type definitions**: Located in `src/types/`
- Follow existing patterns for new types

### ESLint Configuration
- Preact-specific rules with TypeScript support
- Unused vars must start with `_` to be allowed
- No prop-types required (TypeScript handles it)
- React in JSX scope not needed (modern Preact)

### Component Patterns
```typescript
// Standard component structure
interface ComponentProps {
  data: SomeType;
  onChange: (value: SomeType) => void;
}

export function ComponentName({ data, onChange }: ComponentProps) {
  // Hook calls first
  const [state, setState] = useState<StateType>(initialValue);
  
  // Event handlers
  const handleAction = () => {
    // Implementation
  };
  
  // Render
  return (
    <div>
      {/* JSX content */}
    </div>
  );
}
```

### Naming Conventions
- **Components**: PascalCase (e.g., `UniversalBlock`, `KanbanBoard`)
- **Hooks**: camelCase with `use` prefix (e.g., `useMeetingState`)
- **Utilities**: camelCase (e.g., `generateSortKey`, `sortBySortKey`)
- **Types**: PascalCase (e.g., `Block`, `Meeting`, `TopicGroup`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `BLOCK_TYPES`, `APP_CONFIG`)

## Testing Standards

### Requirements
- **All new features** must include tests
- **347+ tests** must pass before committing (`npm test`)
- **Security features** require security tests in `src/test/security.test.ts`
- **Integration tests** cover complete user workflows

### Testing Patterns
```typescript
import { render, screen } from '@testing-library/preact';
import { expect, it, describe } from 'vitest';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName prop="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('should handle user interaction', async () => {
    const onChange = vi.fn();
    render(<ComponentName onChange={onChange} />);
    
    const button = screen.getByRole('button', { name: 'Action' });
    await userEvent.click(button);
    
    expect(onChange).toHaveBeenCalledWith(expectedValue);
  });
});
```

### Hook Testing
```typescript
import { renderHook, act } from '@testing-library/preact';

describe('useCustomHook', () => {
  it('should update state correctly', () => {
    const { result } = renderHook(() => useCustomHook());
    
    act(() => {
      result.current.updateValue('new value');
    });
    
    expect(result.current.value).toBe('new value');
  });
});
```

## Block Type System

### 11 Block Types in 4 Semantic Groups

| Group | Types | Purpose |
|-------|-------|---------|
| **Documentation** | Note, Q&A, Reference | Context and background information |
| **Ideation** | Fact, Idea, Research | Creative concepts and data points |
| **Action** | TODO, Follow-up, Goal | Actionable items and objectives |
| **Decision** | Decision, Issue | Critical outcomes and blockers |

### Creating Blocks
```typescript
import { createBlock } from './utils/blockFactory';
import { BLOCK_TYPES } from './constants/blockTypes';

// Use factory function
const newBlock = createBlock(BLOCK_TYPES.TODO, {
  content: 'Task description',
  topicGroupId: currentTopicGroup.id,
  sortKey: generateSortKey(prevBlock?.sortKey, nextBlock?.sortKey)
});
```

### Block Fields
- `id`: Unique identifier (UUID)
- `type`: One of 11 block types
- `content`: Main text content
- `sortKey`: Lexicographic ordering key
- `topicGroupId`: Parent topic group reference
- `completed`: Boolean (for TODOs only)
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp

## Export/Import System

### Schema Version Management
- Current export version: `v1.0.0` (`CURRENT_EXPORT_VERSION`)
- Use Zod schemas for all data validation (`src/schemas/`)
- Export transformers follow abstract `FormatTransformer` pattern
- Support localization via i18n translation functions

### Adding New Schema Versions
1. Add new schema version in `src/schemas/export.ts`
2. Implement migration function in `src/schemas/migrations.ts`
3. Update `CURRENT_EXPORT_VERSION` constant
4. Update `SUPPORTED_VERSIONS` array
5. Maintain backward compatibility for legacy formats

### Export Formats
- **Markdown (.md)**: Clean, readable format for documentation
- **RTF (.rtf)**: Rich text format for word processors
- **DOCX (.docx)**: Microsoft Word format with formatting
- **HTML (.html)**: Web-ready format with styling
- **JSON (.json)**: Complete data backup with schema version

## Security Guidelines

### Data Privacy
- **No backend calls**: All data stays in browser localStorage
- **No tracking**: Zero analytics or external data collection
- **No secrets**: Never commit API keys, tokens, or credentials
- **User control**: Full data export and clearing capabilities

### Input Validation
- Validate all user input before processing
- Use Zod schemas for external data (imports)
- Sanitize content before export to prevent injection
- Handle edge cases (empty strings, null values, undefined)

## Common Development Tasks

### Adding a New Block Type
1. Add type definition to `BLOCK_TYPES` constant
2. Update type union in `src/types/Block.ts`
3. Add UI rendering logic in `UniversalBlock` component
4. Add block picker option in `BlockTypeModal`
5. Update tests to cover new type
6. Update documentation

### Modifying Drag & Drop
1. Identify if inter-column or intra-column operation
2. Update appropriate handler in `KanbanBoard.tsx`
3. Ensure sortKey is recalculated correctly
4. Test with multiple blocks and edge cases
5. Verify persistence in localStorage

### Adding Export Format
1. Create new transformer in `src/utils/export/transformers/`
2. Implement `FormatTransformer` interface
3. Add format option to export UI
4. Add comprehensive tests for format conversion
5. Update export documentation

## Performance Considerations

- **Auto-save debounce**: 500ms delay prevents excessive localStorage writes
- **SortKey system**: Avoids costly array reindexing operations
- **Preact bundle size**: Keep dependencies minimal (current: ~200KB gzipped)
- **Test execution**: 347+ tests should complete in under 60 seconds
- **Large datasets**: Test with 100+ blocks per meeting

## Development Commands Reference

### Daily Development
```bash
npm run dev          # Start dev server (localhost:5173)
npm test             # Run all tests (347+ should pass)
npm run lint         # Check code quality
npm run build        # Verify production build
```

### Testing
```bash
npm run test:watch   # Watch mode for TDD
npm run test:ui      # Interactive test UI
npm run test:coverage # Coverage report
```

### Quality Assurance
```bash
npm run lint:fix     # Auto-fix ESLint issues
npm run audit        # Check security vulnerabilities
npm run build:secure # Full secure build pipeline
```

### Automation
```bash
just pre-release     # Complete validation pipeline
just                 # List all available commands
```

## Key Files & Directories

```
src/
├── components/       # UI components (KanbanBoard, UniversalBlock, etc.)
├── hooks/           # Custom React hooks (useMeetingState, useTheme, etc.)
├── types/           # TypeScript type definitions
├── utils/           # Utility functions (sortKeys, export, etc.)
├── schemas/         # Zod schemas for validation
├── constants/       # App-wide constants (BLOCK_TYPES, APP_CONFIG)
├── test/            # Test files (.test.ts, .test.tsx)
└── i18n/            # Internationalization (currently English only)

documentation/
├── ARCHITECTURE.md  # Detailed architecture documentation
├── DEVELOPMENT.md   # Development practices and workflows
├── API_REFERENCE.md # Complete API specifications
├── MIGRATION.md     # Schema migration guide
└── ROADMAP.md       # Future features and planning
```

## Best Practices for Copilot Tasks

### ✅ Good Tasks for Copilot
- Adding new block types with existing patterns
- Writing unit tests for new features
- Implementing new export formats
- Adding UI components following existing patterns
- Refactoring small utility functions
- Fixing ESLint warnings
- Adding JSDoc comments to functions

### ⚠️ Tasks Requiring Human Review
- Modifying core drag & drop logic
- Changing sortKey algorithm fundamentals
- Restructuring state management
- Breaking API changes to export schema
- Complex refactorings across multiple files
- Performance-critical optimizations

### ❌ Tasks Not Suitable for Copilot
- Architectural decisions about new major features
- Security audit and vulnerability assessment
- User experience design and interaction patterns
- Deployment and infrastructure configuration
- Database schema design (not applicable - localStorage only)

## Documentation Links

For detailed information, always refer to:
- **Architecture**: `documentation/ARCHITECTURE.md`
- **Development Guide**: `documentation/DEVELOPMENT.md`
- **API Reference**: `documentation/API_REFERENCE.md`
- **Contributing**: `documentation/CONTRIBUTING.md`
- **Getting Started**: `documentation/GETTING_STARTED.md`
- **Migration Guide**: `documentation/MIGRATION.md`

## Final Notes

When contributing code:
1. Follow existing patterns and conventions
2. Write tests for all new functionality
3. Run `npm test` before committing
4. Use semantic imports from `src/` directory
5. Preserve sortKeys and topic assignments during updates
6. Test with the development server for UI changes
7. Update relevant documentation for significant changes
8. Keep the bundle size minimal (Preact advantage)

**The goal is maintainable, tested, and performant code that enhances the meeting management experience while respecting user privacy.**
