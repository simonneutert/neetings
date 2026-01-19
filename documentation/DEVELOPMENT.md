# Development Guide

This guide covers development practices, workflows, and common patterns for contributing to the Neetings codebase.

## 🛠️ Development Environment

### Required Tools
- **Node.js 18+** with npm
- **Git** for version control
- **VS Code** (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier

### Setup Workflow
```bash
# Initial setup
git clone https://github.com/simonneutert/neetings.git
cd neeting-jsx
npm install

# Daily development
npm run dev        # Start development server
npm test           # Run tests (should pass 196+ tests)
npm run lint       # Check code quality
npm run build      # Verify production build
```

## 📋 Development Commands

### Core Commands
```bash
# Development
npm run dev                    # Start dev server (localhost:5173)
npm run build                  # Production build
npm run preview                # Preview production build

# Testing
npm test                       # Run all tests
npm run test:watch             # Watch mode for TDD
npm run test:ui                # Interactive test UI
npm run test:coverage          # Coverage report

# Code Quality
npm run lint                   # ESLint checks
npm run lint:fix               # Auto-fix ESLint issues

# Security & Release
npm run audit                  # Security vulnerability check
npm run audit:fix              # Fix vulnerabilities automatically
npm run build:secure           # Secure build (audit + lint + test + build)
npm run pre-release:secure     # Full pre-release validation

# Automation
just pre-release               # Complete validation pipeline
just                           # List all available commands
```

### Docker Commands
```bash
# Development in Docker
docker-compose up dev          # Containerized development
docker-compose up prod         # Production container

# Testing in Docker
docker-compose run --rm dev npm test
```

## 🧪 Testing Standards

### Test Requirements
- **All new features** must include tests
- **196+ tests** must pass before committing
- **Integration tests** for user workflows
- **Security tests** for sensitive functionality

### Testing Patterns
```typescript
// Component testing
import { render, screen } from '@testing-library/preact';
import { expect, it, describe } from 'vitest';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});

// Hook testing
import { renderHook, act } from '@testing-library/preact';

describe('useCustomHook', () => {
  it('should handle state updates', () => {
    const { result } = renderHook(() => useCustomHook());
    
    act(() => {
      result.current.updateValue('new value');
    });
    
    expect(result.current.value).toBe('new value');
  });
});
```

### Test Organization
- **Unit tests**: Individual functions and components
- **Integration tests**: Complete user workflows
- **Security tests**: Data validation and sanitization
- **Performance tests**: Large dataset handling

## 🏗️ Code Architecture Patterns

### Component Guidelines
```typescript
// Use functional components with hooks
function ComponentName({ prop1, prop2 }: Props) {
  const [state, setState] = useState(initialValue);
  
  // Use semantic naming
  const handleUserAction = useCallback(() => {
    // Handle action
  }, [dependencies]);
  
  return (
    <div class="component-wrapper">
      {/* JSX content */}
    </div>
  );
}
```

### State Management
```typescript
// Always use updateMeeting for state changes
const { meeting, updateMeeting } = useMeetingState();

// Correct way
updateMeeting(meeting => ({
  ...meeting,
  blocks: [...meeting.blocks, newBlock]
}));

// NEVER mutate directly
meeting.blocks.push(newBlock); // ❌ Will cause data loss
```

### Block System Patterns
```typescript
// Creating blocks
const newBlock = createBlock("textblock", topicGroupId, sortKey);

// Working with block types
const config = BLOCK_TYPES[block.type];
const isValidField = config.fields.includes(fieldName);

// SortKey management
const newSortKey = generateSortKey(beforeBlock?.sortKey, afterBlock?.sortKey);
const sortedBlocks = blocks.sort(sortBySortKey);
```

### Error Handling
```typescript
// Always validate inputs
if (!block || !block.id) {
  console.error('Invalid block data');
  return;
}

// Use type guards
function isValidBlockType(type: string): type is Block["type"] {
  return Object.keys(BLOCK_TYPES).includes(type);
}

// Handle async operations
try {
  const result = await exportMeeting(meeting);
  // Handle success
} catch (error) {
  console.error('Export failed:', error);
  // Handle error appropriately
}
```

## 📝 Adding New Features

### 1. Adding a New Block Type

**Step 1**: Update the Block interface
```typescript
// src/types/Block.ts
export interface Block {
  // ... existing fields
  newBlockField?: string;  // Add new field
  type: 
    | "textblock"
    | "qandablock"
    // ... existing types
    | "newblocktype";      // Add new type
}
```

**Step 2**: Add block configuration
```typescript
// src/types/Block.ts - BLOCK_TYPES
newblocktype: {
  label: "New Block",
  color: "action-medium" as SemanticColor,
  fields: ["newBlockField"],
}
```

**Step 3**: Update BlockTypeModal groups
```typescript
// src/components/BlockTypeModal.tsx
{
  name: "Action",  // Or appropriate group
  types: ["todoblock", "goalblock", "newblocktype"], // Add here
  icon: "🎯",
  description: "Group description"
}
```

**Step 4**: Add tests
```typescript
// src/test/blocks.test.ts
describe('New Block Type', () => {
  it('should create new block type correctly', () => {
    const block = createBlock("newblocktype");
    expect(block.type).toBe("newblocktype");
    expect(block.newBlockField).toBe("");
  });
});
```

### 2. Adding Export Formats

**Step 1**: Create transformer
```typescript
// src/utils/export/transformers/NewFormatTransformer.ts
export class NewFormatTransformer extends FormatTransformer {
  getFileExtension(): string {
    return '.newformat';
  }
  
  transform(meeting: Meeting): string {
    // Implement transformation logic
    return formattedContent;
  }
}
```

**Step 2**: Register transformer
```typescript
// src/utils/export/index.ts
export const EXPORT_TRANSFORMERS = {
  // ... existing transformers
  newformat: NewFormatTransformer,
};
```

### 3. Schema Evolution

When data structures change, follow the migration pattern:

**Step 1**: Create new schema version
```typescript
// src/schemas/export.ts
export const ExportV2Schema = z.object({
  version: z.literal("2.0.0"),
  // ... new schema definition
});
```

**Step 2**: Implement migration
```typescript
// src/schemas/migrations.ts
function migrateV1ToV2(data: ExportV1Type): ExportV2Type {
  return {
    version: "2.0.0",
    // ... migration logic
  };
}
```

**Step 3**: Update constants
```typescript
// src/schemas/index.ts
export const CURRENT_EXPORT_VERSION = "2.0.0";
export const SUPPORTED_VERSIONS = ["2.0.0", "1.0.0", "legacy"];
```

## 🎨 Code Style Guidelines

### TypeScript
- **Strict mode** enabled - no `any` types
- **Explicit return types** for functions
- **Interface over type** for object shapes
- **Enum for constants** where appropriate

### Naming Conventions
- **camelCase** for variables and functions
- **PascalCase** for components and types
- **UPPER_SNAKE_CASE** for constants
- **kebab-case** for CSS classes

### File Organization
```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── types/              # TypeScript definitions
├── utils/              # Pure utility functions
├── schemas/            # Zod validation schemas
└── test/               # Test files
```

### Import Organization
```typescript
// 1. External libraries
import { useState, useCallback } from 'preact/hooks';
import { z } from 'zod';

// 2. Internal utilities and types
import { Block, Meeting } from '../types';
import { generateSortKey } from '../utils/sortKeys';

// 3. Components (if any)
import { UniversalBlock } from './UniversalBlock';
```

## 🚀 Pre-Release Checklist

Before submitting a pull request:

```bash
# 1. Code quality
npm run lint                    # Must pass
npm run build                   # Must succeed

# 2. Testing
npm test                        # All 196+ tests must pass
npm run test:coverage           # Check coverage

# 3. Security
npm run audit                   # No high-severity vulnerabilities

# 4. Complete validation
just pre-release                # Run full pipeline
```

### Manual Testing Checklist
- [ ] Create new meeting and blocks
- [ ] Test drag & drop functionality
- [ ] Switch between List and Kanban views
- [ ] Export meeting in multiple formats
- [ ] Import exported data
- [ ] Test attendee management
- [ ] Verify localStorage persistence

## 🐛 Debugging Tips

### Common Issues
- **Blocks not saving**: Check if `updateMeeting` is called correctly
- **Drag not working**: Verify block IDs are strings, not numbers
- **Export errors**: Validate block field definitions match schema
- **Sorting issues**: Ensure `sortBySortKey` is called before display

### Debugging Tools
- **Browser DevTools**: Check localStorage data in Application tab
- **Test UI**: Use `npm run test:ui` for interactive testing
- **Console Logging**: Add strategic console.log statements
- **React DevTools**: Install browser extension for component inspection

## 🤝 Contribution Workflow

### 1. Before Starting
- Check [GitHub Issues](https://github.com/simonneutert/neetings/issues) for tasks
- Read this development guide
- Ensure local setup works correctly

### 2. Development Process
1. **Create branch**: `git checkout -b feature/your-feature`
2. **Make changes** following style guidelines
3. **Add tests** for new functionality
4. **Run validation**: `just pre-release`
5. **Commit changes** with clear messages

### 3. Pull Request
- **Clear title** describing the change
- **Detailed description** of what and why
- **Link issues** using keywords (fixes #123)
- **Screenshots** for UI changes
- **Breaking changes** clearly documented

## 📚 Learning Resources

### Architecture Deep Dive
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and patterns
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Technical specifications

### External Documentation
- **[Preact Guide](https://preactjs.com/guide/v10/getting-started)**
- **[Vite Documentation](https://vitejs.dev/guide/)**
- **[Vitest Testing](https://vitest.dev/guide/)**
- **[Zod Validation](https://zod.dev/)**

### Community
- **[GitHub Discussions](https://github.com/simonneutert/neetings/discussions)**
- **[Issues](https://github.com/simonneutert/neetings/issues)**

---

Happy coding! The Neetings codebase follows clear patterns and is well-tested. Take time to understand the architecture, and don't hesitate to ask questions. 🚀