# Getting Started with Neetings Development

This guide helps new developers get up and running with the Neetings codebase quickly and efficiently.

## 🚀 Quick Setup

### Prerequisites
- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **Git** - For version control
- **VS Code** (recommended) - With TypeScript and ESLint extensions

### Installation

```bash
# Clone the repository
git clone https://github.com/simonneutert/neetings.git
cd neeting-jsx

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [localhost:5173](http://localhost:5173) - you should see the Neetings app running!

### Verify Setup

```bash
# Run tests (should pass 196+ tests)
npm test

# Check code quality
npm run lint

# Build for production
npm run build
```

## 📚 Understanding the Codebase

### What is Neetings?

Neetings is a **local-first meeting management platform** that transforms chaotic meeting notes into organized, actionable outcomes. All data is stored in your browser's localStorage - no backend required.

### Core Concepts (5-minute read)

1. **Meetings** - Containers for all meeting content
2. **Blocks** - Individual content items (11 types: Note, Q&A, Research, etc.)
3. **Topic Groups** - Kanban columns that organize blocks
4. **Attendees** - Global registry of meeting participants

### Tech Stack

- **Frontend**: [Preact](https://preactjs.com/) (3kB React alternative) with TypeScript
- **Build**: [Vite](https://vitejs.dev/) with hot module replacement
- **Testing**: [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) (196+ tests)
- **State**: React hooks with localStorage persistence
- **Drag & Drop**: [@dnd-kit](https://dndkit.com/) for Kanban functionality
- **Schema**: [Zod](https://zod.dev/) for data validation

## 🗂️ File Structure Overview

```
src/
├── components/              # Preact components
│   ├── KanbanBoard.tsx         # Main Kanban view
│   ├── UniversalBlock.tsx      # Block editing interface
│   └── BlockTypeModal.tsx      # Block type selection
├── hooks/                   # Custom React hooks
│   ├── useMeetingState.ts      # Main state management
│   ├── useTopicGroups.ts       # Topic group operations
│   └── useGlobalAttendees.ts   # Attendee registry
├── types/                   # TypeScript definitions
│   ├── Block.ts                # Block types and configuration
│   ├── Meeting.ts              # Meeting structure
│   └── Attendee.ts             # Attendee definitions
├── utils/                   # Utility functions
│   ├── sortKeys.ts             # Block ordering system
│   └── export/                 # Export transformers
└── schemas/                 # Zod validation schemas
    ├── export.ts               # Export format validation
    └── migrations.ts           # Schema migration functions
```

## 🎯 Your First Tasks

### 1. Explore the App
- Create a new meeting
- Add different block types (Note, TODO, Decision, etc.)
- Switch between List and Kanban views
- Try drag & drop functionality
- Export a meeting to see the output

### 2. Run the Tests
```bash
# Full test suite
npm test

# Watch mode for development
npm run test:watch

# Interactive test UI
npm run test:ui
```

### 3. Read the Architecture
Once you're familiar with the app, dive deeper into the technical architecture:

📖 **[Architecture Guide](./ARCHITECTURE.md)** - Core systems and patterns
🔧 **[Development Guide](./DEVELOPMENT.md)** - Development practices and workflows
📋 **[API Reference](./API_REFERENCE.md)** - Technical specifications

## 🤝 Contributing

Ready to contribute? Here's how:

1. **Pick an issue** from [GitHub Issues](https://github.com/simonneutert/neetings/issues)
2. **Create a branch**: `git checkout -b feature/your-feature`
3. **Make changes** following our development guidelines
4. **Add tests** for new functionality
5. **Submit a PR** with a clear description

See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for detailed guidelines.

## 🆘 Getting Help

- **Architecture questions**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Development practices**: See [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Technical specs**: See [API_REFERENCE.md](./API_REFERENCE.md)
- **Issues**: [GitHub Issues](https://github.com/simonneutert/neetings/issues)
- **Discussions**: [GitHub Discussions](https://github.com/simonneutert/neetings/discussions)

## 🎊 Welcome to the Team!

You're all set! The Neetings codebase is well-tested, TypeScript-strict, and follows clear patterns. Take your time exploring, and don't hesitate to ask questions.

**Happy coding!** 🚀