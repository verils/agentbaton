import type { AgentDefinition } from '../../types/agent.js';

export const geminiCli: AgentDefinition = {
  name: 'gemini-cli',
  displayName: 'Gemini CLI',
  apiType: 'gemini',
  configPath: '~/.gemini/settings.json',
  configFormat: 'json',
  models: [
    {
      slot: 'default',
      key: 'model',
      description: '默认模型',
    },
  ],
};
