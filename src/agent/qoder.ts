import type { AgentDefinition } from '../types';

export const qoder: AgentDefinition = {
  id: 'qoder',
  name: 'Qoder',
  command: 'qoder',
  apiType: 'openai',
  home: {
    linux: '~/.config/qoder/config.json',
    macos: '~/Library/Application Support/Qoder/config.json',
    windows: '~/AppData/Roaming/Qoder/config.json',
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
