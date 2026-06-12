import type { AgentDefinition } from '../types';

export const codexCli: AgentDefinition = {
  id: 'codex-cli',
  name: 'Codex CLI',
  command: 'codex',
  apiType: 'openai',
  configPaths: {
    linux: '~/.codex/config.json',
    macos: '~/.codex/config.json',
    windows: '~/.codex/config.json',
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
