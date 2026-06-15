# AGENTS.md

CLI tool (ESM) that configures AI coding agents (Claude Code, Codex CLI, etc.) with cloud provider API keys. Written in TypeScript, built with Vite targeting Node.js 22+.

## Commands

| Action | Command |
|--------|---------|
| Build | `pnpm build` |
| Test | `pnpm test` |
| Test (watch) | `pnpm test:watch` |
| Type check | `pnpm typecheck` |
| Lint | `pnpm lint` (no eslint config file exists yet — script may fail) |
| Run built CLI | `pnpm start` or `node dist/cli.js` |
| Dev (watch build) | `pnpm dev` |

Always run `pnpm typecheck` and `pnpm test` before considering work done.

## Architecture

Single-package repo, not a monorepo. Entry point: `src/cli.ts` → `dist/cli.js`.

```
src/
  cli.ts            # Commander entry point, delegates to prompt/
  agent/            # Agent definitions (one file per agent + builtin.ts registry)
  provider/presets/ # Provider templates (one file per provider + index.ts registry)
  config/           # Load/save ~/.agentbaton/config.json (JSON, not TOML)
  prompt/           # TUI menus via @clack/prompts
  types/            # Shared interfaces (AgentDefinition, ProviderPreset, AgentBatonConfig, etc.)
  utils/            # Path helpers, string width, command detection
```

## Key patterns

- **Agent definitions**: Each agent is a `const` object implementing `AgentDefinition` (in `src/agent/<name>.ts`). Register it in `src/agent/builtin.ts`. Agents define `parseConfig()` and `saveConfig()` for reading/writing the agent's native config files.
- **Provider presets**: Each provider is a `const` implementing `ProviderPreset` (in `src/provider/presets/<name>.ts`). Register it in `src/provider/presets/index.ts`. Presets are templates — after user creates a provider instance, it's stored independently.
- **Config persistence**: All user config lives in `~/.agentbaton/config.json` (JSON). The `readJson`/`writeJson` helpers also handle TOML for agent-native config files.
- **API type matching**: Agents declare an `ApiType` (`'openai' | 'anthropic' | 'google'`); providers declare endpoints with types. Only matching pairs can be enabled.
- **Vite build**: Library mode targeting `node22`, ESM format, no minification, all npm deps externalized. If adding a new npm dependency, add it to `rollupOptions.external` in `vite.config.ts`.

## Testing

Uses Vitest. Tests in `tests/` mirror the source structure. Agent tests use a shared `defineSyncAgentTests()` helper (`tests/agent/define-sync-agent-tests.ts`) for common metadata assertions.

## Gotchas

- `pnpm lint` references eslint but no `.eslintrc` or `eslint.config.*` exists — it will likely error.
- Several agents are commented out in `src/agent/builtin.ts` (geminiCli, opencode, mimoCode, qoder, qoderCn, qwenCode). They exist as files but aren't registered.
- `expandHome('~')` splits on index 2 (`path.slice(2)`) — this assumes `~/...` format (tilde + slash). Single `~` would produce an empty slice.
