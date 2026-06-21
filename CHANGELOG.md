# Changelog

All notable changes to this project will be documented in this file.

## [v0.3.0] - 2026-06-21

### Added

- **Cline Agent**: Added Cline agent definition with configuration management
- **Pi Agent**: Added Pi agent definition and configuration support
- **Kimi Provider**: Added Moonshot (月之暗面) Kimi model provider preset
- **ESLint Configuration**: Added `eslint.config.js` with TypeScript rules

### Fixed

- **Path Expansion**: Fixed `expandHome('~')` edge case bug
- **Lint Script**: Fixed `pnpm lint` not working due to missing ESLint config

### Changed

- **Provider Presets**: Migrated all provider presets from `apiType`/`baseUrl` to `pricing` structure
- **Menu Options**: Unified menu option definitions and code style
- **Slot Descriptions**: Marked slot description fields as deprecated
- **Cleanup**: Removed deprecated `apiType`/`baseUrl` fields and fallback code from `ProviderPreset`

---

## [v0.2.0] - 2026-06-18

### Added

- **Volcengine Provider**: Added Volcengine provider preset configuration with multiple pricing plans (Default, Coding Plan, Agent Plan)
- **Model Configuration**: Added model configuration support with optimized code structure
- **OpenCode Integration**: Enabled OpenCode agent integration with full configuration support
- **Multi-Provider Management**: Support for managing multiple provider configurations
- **Agent Detection**: Enhanced agent detection with caching for command availability checks

### Fixed

- **CLI Exit Issue**: Fixed stdin blocking issue when command line interface exits abnormally

### Changed

- **Configuration Naming**: Renamed configuration-related types and methods to "native configuration" for clarity
- **Built-in Agents**: Switched built-in agent configuration for better defaults
- **Module Cleanup**: Removed unused agent modules and fixed type declarations

### Testing

- Added comprehensive configuration loading/saving tests for OpenCode agent
- Added complete test suite for Qwen Code agent

---

## [v0.1.1] - 2026-06-17

### Changed

- **Agent Configuration**: Renamed configuration parsing methods to "load configuration" for consistency across all agent implementations
- **Path Utilities**: Replaced path resolution functions to simplify code structure and improve maintainability
- **Gemini CLI**: Refactored environment variable configuration for better clarity and organization

### Improved

- **Gemini CLI**: Enhanced configuration handling and environment variable management
- **Code Quality**: Standardized method naming conventions across agent modules

---

## [v0.1.0] - 2026-06-17

### Added

- Initial release of AgentBaton CLI tool
- Support for configuring AI coding agents with cloud provider API keys
- Agent definitions for Claude Code, Codex CLI, Gemini CLI, OpenCode, Qoder, Qwen Code
- Provider presets management system
- TUI menus via @clack/prompts for interactive configuration
- JSON-based configuration persistence at `~/.agentbaton/config.json`
- API type matching between agents and providers (OpenAI, Anthropic, Google)
- Vitest testing framework setup
- Vite build system targeting Node.js 22+ with ESM format

### Supported Agents

- Claude Code
- Codex CLI
- Gemini CLI
- OpenCode
- Qoder
- Qwen Code
