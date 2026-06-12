import type { AgentDefinition } from '../types';

export const qoder: AgentDefinition = {
  id: 'qoder',
  name: 'Qoder',
  command: 'qoder',
  apiType: 'openai',
  configPaths: {
    linux: '~/.config/qoder/config.json',
    macos: '~/Library/Application Support/Qoder/config.json',
    windows: '~/AppData/Roaming/Qoder/config.json',
  },
  configFormat: 'json',
  models: [
    {
      slot: 'default',
      name: 'model',
      description: '默认模型',
    },
  ],
  parseConfig(config) {
    return {
      models: { default: (config.model as string) ?? '' },
      baseUrl: config.baseUrl as string | undefined,
      apiKey: config.apiKey as string | undefined,
    };
  },
};
