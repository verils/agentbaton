import type { AgentDefinition } from '../types/index.js';

export const qoder: AgentDefinition = {
  id: 'qoder',
  name: 'Qoder',
  command: 'qoder',
  apiType: 'openai',
  home: {
    linux: '~/.config/qoder/config/index.json',
    macos: '~/Library/Application Support/Qoder/config/index.json',
    windows: '~/AppData/Roaming/Qoder/config/index.json',
  },
  models: [
    {
      slot: 'default',
      name: 'model',
      description: '默认模型',
    },
  ],
  async loadNativeConfig() {
    return null;
  },
  async saveNativeConfig() {},
};
