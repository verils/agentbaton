import type { AgentDefinition } from '../types';

export const opencode: AgentDefinition = {
  name: 'opencode',
  displayName: 'OpenCode',
  command: 'opencode',
  apiType: 'openai',
  configPath: {
    linux: '~/.config/opencode/config.json',
    macos: '~/Library/Application Support/opencode/config.json',
    windows: '~/AppData/Roaming/opencode/config.json',
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
