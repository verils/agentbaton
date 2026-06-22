import type { AgentDefinition } from '../types/index.js';

export const qoderCn: AgentDefinition = {
  id: 'qoder-cn',
  name: 'Qoder CN',
  command: 'qoder-cn',
  apiType: 'openai',
  home: {
    linux: '~/.config/qoder-cn/config/index.json',
    macos: '~/Library/Application Support/QoderCN/config/index.json',
    windows: '~/AppData/Roaming/QoderCN/config/index.json',
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
