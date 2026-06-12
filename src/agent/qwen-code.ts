import type { AgentDefinition } from '../types';

export const qwenCode: AgentDefinition = {
  id: 'qwen-code',
  name: 'Qwen Code',
  command: 'qwen',
  apiType: 'openai',
  configPaths: {
    linux: '~/.config/qwen/config.json',
    macos: '~/Library/Application Support/Qwen/config.json',
    windows: '~/AppData/Roaming/Qwen/config.json',
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
