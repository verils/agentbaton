import type { AgentDefinition } from '../types';

export const qoderCn: AgentDefinition = {
  name: 'qoder-cn',
  displayName: 'Qoder CN',
  command: 'qoder-cn',
  apiType: 'openai',
  configPath: {
    linux: '~/.config/qoder-cn/config.json',
    macos: '~/Library/Application Support/QoderCN/config.json',
    windows: '~/AppData/Roaming/QoderCN/config.json',
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
