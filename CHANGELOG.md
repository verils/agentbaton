# Changelog

All notable changes to this project will be documented in this file.

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
