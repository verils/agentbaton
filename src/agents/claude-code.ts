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
      name: 'Opus',
      description: 'Claude Opus 模型',
    },
    {
      slot: 'sonnet',
      name: 'Sonnet',
      description: 'Claude Sonnet 模型',
    },
    {
      slot: 'haiku',
      name: 'Haiku',
      description: 'Claude Haiku 模型',
    },
  ],
  parseConfig(config) {
    return {
      models: {
        opus: (config.Opus as string) ?? '',
        sonnet: (config.Sonnet as string) ?? '',
        haiku: (config.Haiku as string) ?? '',
      },
      baseUrl: config.baseUrl as string | undefined,
      apiKey: config.apiKey as string | undefined,
    };
  },
};
