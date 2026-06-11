import type { AgentDefinition } from '../types';

export const geminiCli: AgentDefinition = {
  name: 'gemini-cli',
  displayName: 'Gemini CLI',
  command: 'gemini',
  apiType: 'google',
  configPath: {
    linux: '~/.gemini/settings.json',
    macos: '~/.gemini/settings.json',
    windows: '~/AppData/Roaming/gemini/settings.json',
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
