import type { AgentDefinition } from '../types/index.js';

export const mimoCode: AgentDefinition = {
  id: 'mimocode',
  name: 'MiMoCode',
  command: 'mimo',
  apiType: 'openai',
  home: {
    linux: '~/.config/qwen/config/index.json',
    macos: '~/Library/Application Support/Qwen/config/index.json',
    windows: '~/AppData/Roaming/Qwen/config/index.json',
  },
  models: [
    {
      slot: 'default',
      name: 'Default',
    },
  ],
  async loadNativeConfig() {
    return null;
  },
  async saveNativeConfig() {},
};
