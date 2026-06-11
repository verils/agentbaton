import type { AgentDefinition } from '../../types';

export const codexCli: AgentDefinition = {
  name: 'codex-cli',
  displayName: 'Codex CLI',
  command: 'codex',
  apiType: 'openai',
  configPath: {
    linux: '~/.codex/config.json',
    macos: '~/.codex/config.json',
    windows: '~/.codex/config.json',
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
