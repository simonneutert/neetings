# Neetings JSX Justfile
# ====================
#
# This justfile contains automation scripts for the Neetings JSX project.
# Neetings is a meeting management application built with React/JSX.
#
# Available commands:
#   default     - List all available commands (default action)
#   prerelease  - Run complete prerelease validation pipeline
#
# Usage:
#   just                # Show available commands
#   just prerelease     # Run prerelease checks
#
# Requirements:
#   - just (command runner)
#   - npm (Node.js package manager)
#   - All project dependencies installed via `npm install`

# Show all available commands with descriptions
default:
	@just --list

# Run complete pre-release validation pipeline (tests, lint, build, preview)
pre-release:
	echo "Running prerelease tasks..."
	npm test          		# All tests pass
	npm run lint      		# Code quality checks
	deno fmt src/**/*.ts* # Code formatting with Deno
	npm run build     		# Production build succeeds
	npm run preview				# Manual testing
