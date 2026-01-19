# 🤝 Contributing to Neetings

We love contributions! This guide will help you get started with contributing to the Neetings project.

## 🚀 Quick Contribution Process

1. **Fork** this repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes with tests
4. **Run** the full test suite: `npm test`
5. **Submit** a pull request

## 📋 Contribution Guidelines

### Code Quality Standards

- **Write tests** for new features (maintain 196+ passing tests)
- **Follow TypeScript** strict mode guidelines
- **Use conventional commits** for clear history
- **Update documentation** for user-facing changes
- **Run linting** before submitting: `npm run lint`

### Development Workflow

1. **Setup Development Environment**
   ```bash
   git clone https://github.com/simonneutert/neetings.git
   cd neeting-jsx
   npm install
   npm run dev
   ```

2. **Run Tests and Quality Checks**
   ```bash
   npm test          # All tests pass
   npm run lint      # Code quality checks
   npm run build     # Production build succeeds
   npm run preview   # Manual testing
   ```

3. **Follow Coding Standards**
   - TypeScript strict mode for bulletproof code
   - ESLint + Prettier for consistent code style
   - Comprehensive test coverage for all functionality

## 📚 Developer Documentation

### Developer Resources
- **[Getting Started Guide](./GETTING_STARTED.md)** - Quick setup for new developers
- **[Architecture Guide](./ARCHITECTURE.md)** - Core systems and design patterns
- **[Development Guide](./DEVELOPMENT.md)** - Development practices and workflows
- **[API Reference](./API_REFERENCE.md)** - Technical specifications and data structures
- **[Schema Migration Guide](./MIGRATION.md)** - Data format evolution and versioning patterns
- **[Docker Setup Guide](./README.DOCKER.md)** - Containerization and deployment instructions
- **[Project Roadmap](./ROADMAP.md)** - Planned features and development priorities

### Development Standards

**Before contributing, please review:**
1. **[Getting Started Guide](./GETTING_STARTED.md)** - Set up your environment
2. **[Development Guide](./DEVELOPMENT.md)** - Follow our development practices
3. **[Architecture Guide](./ARCHITECTURE.md)** - Understand the system design

**Key Requirements:**
- All new features must include tests (maintain 196+ passing tests)
- Follow TypeScript strict mode guidelines
- Use conventional commits for clear history
- Run `npm test` and `npm run lint` before submitting

## 🎯 Areas We Need Help

### High Priority
- **🌍 Translations** for additional languages
- **🎨 UI/UX improvements** and accessibility
- **📱 Mobile experience** enhancements
- **🧪 Additional test cases** for edge scenarios
- **📚 Documentation** and tutorial content

### Feature Development
- Export format enhancements (see [Roadmap](./ROADMAP.md))
- Performance optimizations
- Advanced filtering capabilities
- Integration improvements

### Infrastructure
- CI/CD pipeline enhancements
- Docker optimization
- Test coverage expansion
- Documentation improvements

## 🐛 Reporting Issues

### Bug Reports
- **[GitHub Issues](https://github.com/simonneutert/neetings/issues)** - Bug reports and feature requests
- **[GitHub Discussions](https://github.com/simonneutert/neetings/discussions)** - General questions and ideas

### Issue Guidelines
1. **Search existing issues** before creating new ones
2. **Use issue templates** when available
3. **Provide clear reproduction steps** for bugs
4. **Include browser and environment information**
5. **Attach screenshots** for UI-related issues

## 🔄 Pull Request Process

### Before Submitting
1. **Ensure all tests pass**: `npm test`
2. **Run linting**: `npm run lint`
3. **Test build process**: `npm run build`
4. **Update documentation** for user-facing changes
5. **Add tests** for new functionality

### PR Guidelines
- **Clear title** describing the change
- **Detailed description** of what was changed and why
- **Link related issues** using keywords (fixes #123)
- **Screenshots** for UI changes
- **Breaking changes** clearly documented

### Review Process
1. **Automated checks** must pass (tests, linting, build)
2. **Code review** by maintainers
3. **Testing** on different browsers/devices when applicable
4. **Documentation review** for user-facing changes

## 💬 Community Guidelines

### Communication
- **Be respectful** and inclusive in all interactions
- **Provide constructive feedback** during code reviews
- **Help others** learn and contribute
- **Share knowledge** through documentation and discussions

### Getting Help
- **[GitHub Discussions](https://github.com/simonneutert/neetings/discussions)** for general questions
- **[Discord/Slack]** for real-time chat (if available)
- **Code review comments** for specific technical questions

## 🏆 Recognition

### Contributors
- All contributors will be recognized in our documentation
- Significant contributions may be highlighted in release notes
- Active contributors may be invited to join the core team

### Types of Contributions
- **Code** - Features, bug fixes, performance improvements
- **Documentation** - Guides, tutorials, API documentation
- **Testing** - Test cases, manual testing, bug reports
- **Design** - UI/UX improvements, accessibility enhancements
- **Translation** - Localization for different languages
- **Community** - Helping others, moderating discussions

## 📄 License

By contributing to Neetings, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Neetings! Your help makes this project better for everyone. 🙏