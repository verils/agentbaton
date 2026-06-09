import type { AgentDefinition } from '../../types/agent.js';

export const claudeCode: AgentDefinition = {
  name: 'claude-code',
  displayName: 'Claude Code',
  apiType: 'anthropic',
  configPath: '~/.claude/settings.json',
  configFormat: 'json',
  models: [
    {
      slot: 'main',
      key: 'model',
      description: '主模型',
    },
    {
      slot: 'small_fast',
      key: 'smallModel',
      description: '轻量模型（用于简单任务）',
    },
    {
      slot: 'thinking',
      key: 'thinkingModel',
      description: '思考模型（用于推理任务）',
    },
  ],
};
