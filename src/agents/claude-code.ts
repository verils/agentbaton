import type { AgentDefinition } from '../types';

export const claudeCode: AgentDefinition = {
  name: 'claude-code',
  displayName: 'Claude Code',
  command: 'claude',
  apiType: 'anthropic',
  configPath: {
    linux: '~/.claude/settings.json',
    macos: '~/.claude/settings.json',
    windows: '~/.claude/settings.json',
  },
  configFormat: 'json',
  models: [
    {
      slot: 'opus',
      key: 'Opus',
      description: 'Claude Opus 模型',
    },
    {
      slot: 'sonnet',
      key: 'Sonnet',
      description: 'Claude Sonnet 模型',
    },
    {
      slot: 'haiku',
      key: 'Haiku',
      description: 'Claude Haiku 模型',
    },
  ],
};
