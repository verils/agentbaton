import type { AgentDefinition } from '../../types/agent';

export const opencode: AgentDefinition = {
  name: 'opencode',
  displayName: 'OpenCode',
  apiType: 'openai',
  configPath: '~/.config/opencode/config.json',
  configFormat: 'json',
  models: [
    {
      slot: 'default',
      key: 'model',
      description: '默认模型',
    },
  ],
};
