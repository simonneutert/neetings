# Docker Setup for Neetings JSX

This document explains how to run the **Neetings JSX** meeting notes application using Docker for both development and production environments.

## About Neetings JSX

Neetings JSX is a TypeScript/Preact-based meeting notes application that allows you to:
- Create and manage meetings with 11 structured block types (Note, Q&A, Research, Fact, Decision, Issue, TODO, Goal, Follow-up, Idea, Reference)
- Filter and navigate through meeting content
- Import/export meeting data
- Track TODO completion status
- Auto-save meeting data to localStorage

## 📋 Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your system
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

## 🏗️ Docker Architecture

The Dockerfile uses a multi-stage build approach optimized for Preact/Vite applications:

1. **Base**: Sets up Node.js 24 Alpine with production dependencies
2. **Dev**: Development environment with Vite hot reloading on port 5173
3. **Build**: Builds the Preact application using `vite build`
4. **Production**: Serves the built static files with Nginx

## 🚀 Quick Start

### Development Mode (Recommended for local development)

```bash
# Start development server with hot reloading
docker-compose up dev

# Or run in detached mode
docker-compose up -d dev
```

The application will be available at: http://localhost:5173

**Features available in development mode:**
- Hot module replacement (HMR) for instant code updates
- TypeScript compilation with error reporting
- Preact DevTools support (install browser extension)
- All 7 block types: TODO, Q&A, Research, Fact, Decision, Issue, Note
- Meeting creation, editing, and management
- Real-time localStorage persistence

### Production Mode

```bash
# Build and start production server
docker-compose up prod

# Or run in detached mode
docker-compose up -d prod
```

The application will be available at: http://localhost:80

**Production features:**
- Optimized static asset serving via Nginx
- Compressed bundle sizes for faster loading
- All meeting management functionality
- Persistent data storage in browser localStorage

## 🛠️ Manual Docker Commands

### Development

```bash
# Build development image
docker build --target dev -t neeting-jsx:dev .

# Run development container
docker run -p 5173:5173 -v $(pwd):/app -v /app/node_modules neeting-jsx:dev

# Run with environment variables
docker run -p 5173:5173 -v $(pwd):/app -v /app/node_modules -e NODE_ENV=development neeting-jsx:dev
```

### Production

```bash
# Build production image
docker build --target production -t neeting-jsx:prod .

# Run production container
docker run -p 80:80 neeting-jsx:prod

# Run on different port
docker run -p 8080:80 neeting-jsx:prod
```

## 🔧 Available Services

### Docker Compose Services

| Service | Purpose | Port | Target |
|---------|---------|------|--------|
| `dev` | Development with hot reload | 5173 | development |
| `prod` | Production with Nginx | 80 | production |

## 📁 Volume Mounts

### Development Mode
- **Source code**: `./` → `/app` (enables hot reloading)
- **Node modules**: `/app/node_modules` (prevents overwriting)

### Production Mode
- No volumes (self-contained image)

## 🌍 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development`/`production` | Application environment |

## 🧪 Running Tests in Docker

The Neetings JSX project includes comprehensive tests using Vitest and Testing Library:

```bash
# Run all tests (196+ test cases)
docker-compose run --rm dev npm test

# Run tests with coverage reporting
docker-compose run --rm dev npm run test:coverage

# Run tests in watch mode (great for TDD)
docker-compose run --rm dev npm run test:watch

# Run test UI for interactive testing
docker-compose run --rm -p 51204:51204 dev npm run test:ui

# Run ESLint code quality checks
docker-compose run --rm dev npm run lint

# Fix auto-fixable ESLint issues
docker-compose run --rm dev npm run lint:fix
```

**Test Coverage Areas:**
- Block creation and management (UniversalBlock, BlockVisual)
- Meeting CRUD operations
- Filter and navigation functionality
- TODO completion and checkbox behavior
- Data import/export
- Auto-focus and user experience
- Complex integration workflows

**Code Quality:**
- ESLint with TypeScript support for code quality
- Preact-specific linting rules
- Auto-fixable issues for consistent code style

## 🚀 CI/CD Integration

This Docker setup integrates seamlessly with the GitHub Actions CI/CD pipeline:

```bash
# The CI pipeline uses these Docker commands:
# 1. Run tests in container (like you do locally)
docker-compose run --rm dev npm test

# 2. Run linting checks
docker-compose run --rm dev npm run lint

# 3. Build production image (on main branch only)
docker build --target production -t neetings:prod .

# 4. Push to GitHub Container Registry
# Images available at: ghcr.io/[username]/neetings
```

**CI/CD Features:**
- Automated testing on every PR
- Code quality checks with ESLint
- Docker builds only on main branch commits
- Multi-stage optimized builds
- Automatic image tagging and registry push

## 🔍 Debugging

### View Container Logs

```bash
# View logs for development
docker-compose logs dev

# View logs for production
docker-compose logs prod

# Follow logs in real-time
docker-compose logs -f dev
```

### Access Container Shell

```bash
# Access development container
docker-compose exec dev sh

# Access production container (Nginx)
docker-compose exec prod sh
```

### Inspect Container

```bash
# List running containers
docker ps

# Inspect container details
docker inspect neeting-jsx-dev-1
```

## 🧹 Cleanup

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop and remove images
docker-compose down --rmi all
```

### Remove Images

```bash
# Remove development image
docker rmi neeting-jsx:dev

# Remove production image
docker rmi neeting-jsx:prod

# Remove all unused images
docker image prune -a
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the port
lsof -i :5173

# Use different port
docker run -p 3000:5173 neeting-jsx:dev
```

#### Permission Issues (macOS/Linux)
```bash
# Fix file permissions
sudo chown -R $(whoami) .
```

#### Node Modules Issues
```bash
# Clear node_modules volume and rebuild
docker-compose down -v
docker-compose up dev
```

#### TypeScript Compilation Issues
```bash
# Check TypeScript errors in container
docker-compose run --rm dev npx tsc --noEmit

# View detailed build logs
docker-compose up dev 2>&1 | grep -E "(error|Error|ERROR)"
```

#### Preact/Vite Specific Issues
```bash
# Clear Vite cache
docker-compose run --rm dev npm run dev -- --force

# Check Vite configuration
docker-compose run --rm dev cat vite.config.ts
```

#### Build Failures
```bash
# Clean build
docker system prune -a
docker-compose build --no-cache
```

### Performance Optimization

#### Development
- Volume mounts enable instant file watching and HMR
- Vite's fast rebuild system works seamlessly in Docker
- TypeScript incremental compilation reduces build times
- Preact's small bundle size ensures quick container startup

#### Production
- Multi-stage builds reduce final image size (~50MB)
- Nginx efficiently serves static Preact bundles
- Alpine Linux base images minimize attack surface
- Gzip compression enabled for faster asset delivery

## 📊 Image Sizes

Typical image sizes for Neetings JSX:
- **Development**: ~400MB (includes dev dependencies, TypeScript, Vitest, ESLint)
- **Production**: ~50MB (Nginx + optimized Preact bundle only)
- **Built assets**: ~2MB (optimized TypeScript/Preact application)

## 🔗 Useful Commands

```bash
# Check Docker version
docker --version
docker-compose --version

# View running containers
docker ps

# View all images
docker images

# Clean up everything
docker system prune -a

# Monitor resource usage
docker stats
```

## 📝 Configuration Files

- `Dockerfile`: Multi-stage build optimized for Preact/Vite applications
- `docker-compose.yml`: Service orchestration for dev and prod environments
- `.dockerignore`: Excludes node_modules, dist, tests, and IDE files
- `vite.config.ts`: Vite configuration with Preact preset
- `tsconfig.json`: TypeScript configuration for strict type checking

## 🤝 Development Workflow

1. **Start development environment**: `docker-compose up dev`
2. **Access the application**: Open http://localhost:5173
3. **Create your first meeting**: Click "New Meeting" and add blocks
4. **Make code changes**: Files auto-reload with Vite HMR
5. **Run tests**: `docker-compose run --rm dev npm test` (should pass all 196+ tests)
6. **Check code quality**: `docker-compose run --rm dev npm run lint`
7. **Test different block types**: Try TODO, Q&A, Research, Facts, Decisions, Issues, Stories
8. **Build for production**: `docker-compose up prod`
9. **Clean up**: `docker-compose down`

### Key Application Features to Test:
- **Block Management**: Create, edit, move, and delete different block types
- **TODO Functionality**: Mark TODOs as complete/incomplete
- **Meeting Navigation**: Switch between meetings and overview
- **Filter System**: Filter blocks by type and completion status
- **Data Persistence**: Refresh browser to verify localStorage works
- **Import/Export**: Test JSON data backup and restore

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Vite Docker Guide](https://vitejs.dev/guide/static-deploy.html)
- [Preact Documentation](https://preactjs.com/guide/v10/getting-started)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [TypeScript Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

## 🎯 Project-Specific Notes

- **Data Storage**: All meeting data is stored in browser localStorage (no backend required)
- **Block Types**: The application supports 7 different block types with color-coded badges
- **Testing**: Comprehensive test suite covers all major functionality
- **Type Safety**: Full TypeScript coverage with strict type checking
- **Component Architecture**: Uses shared BlockVisual component for consistent styling
