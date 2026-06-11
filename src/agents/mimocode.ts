import type { AgentDefinition } from '../types';

export const mimoCode: AgentDefinition = {
  name: 'mimocode',
  displayName: 'MiMoCode',
  command: 'mimo',
  apiType: 'openai',
  configPath: {
    linux: '~/.config/qwen/config.json',
    macos: '~/Library/Application Support/Qwen/config.json',
    windows: '~/AppData/Roaming/Qwen/config.json',
  },
  configFormat: 'json',
  models: [
    {
      slot: 'default',
      key: 'model',
      description: '默认模型',
    },
  ],
};
