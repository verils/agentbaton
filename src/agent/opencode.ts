import type { AgentDefinition } from '../types';

export const opencode: AgentDefinition = {
  id: 'opencode',
  name: 'OpenCode',
  command: 'opencode',
  apiType: 'openai',
  home: {
    linux: '~/.config/opencode/config.json',
    macos: '~/Library/Application Support/opencode/config.json',
    windows: '~/AppData/Roaming/opencode/config.json',
  },
  models: [
    {
      slot: 'default',
      name: 'model',
      description: '默认模型',
    },
  ],
  async parseConfig() {
    return null;
  },
  async saveConfig() {},
};
