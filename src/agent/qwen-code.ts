import type { AgentDefinition } from '../types';

export const qwenCode: AgentDefinition = {
  id: 'qwen-code',
  name: 'Qwen Code',
  command: 'qwen',
  apiType: 'openai',
  home: {
    linux: '~/.config/qwen/config.json',
    macos: '~/Library/Application Support/Qwen/config.json',
    windows: '~/AppData/Roaming/Qwen/config.json',
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
