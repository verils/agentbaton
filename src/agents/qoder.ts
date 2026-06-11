import type { AgentDefinition } from '../types';

export const qoder: AgentDefinition = {
  name: 'qoder',
  displayName: 'Qoder',
  command: 'qoder',
  apiType: 'openai',
  configPath: {
    linux: '~/.config/qoder/config.json',
    macos: '~/Library/Application Support/Qoder/config.json',
    windows: '~/AppData/Roaming/Qoder/config.json',
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
