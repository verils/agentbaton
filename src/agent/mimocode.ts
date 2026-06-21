import type { AgentDefinition } from '../types';

export const mimoCode: AgentDefinition = {
  id: 'mimocode',
  name: 'MiMoCode',
  command: 'mimo',
  apiType: 'openai',
  home: {
    linux: '~/.config/qwen/config.json',
    macos: '~/Library/Application Support/Qwen/config.json',
    windows: '~/AppData/Roaming/Qwen/config.json',
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
