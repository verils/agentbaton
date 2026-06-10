import type { AgentDefinition } from '../../types';

export const opencode: AgentDefinition = {
  name: 'opencode',
  displayName: 'OpenCode',
  command: 'opencode',
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
