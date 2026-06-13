import type { AgentDefinition } from '../types';

export const qwenCode: AgentDefinition = {
  id: 'qwen-code',
  name: 'Qwen Code',
  command: 'qwen',
  apiType: 'openai',
  home: {
    linux: '~/.qwen',
    macos: '~/.qwen',
    windows: '~/.qwen',
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
