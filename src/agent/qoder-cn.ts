import type { AgentDefinition } from '../types';

export const qoderCn: AgentDefinition = {
  id: 'qoder-cn',
  name: 'Qoder CN',
  command: 'qoder-cn',
  apiType: 'openai',
  home: {
    linux: '~/.config/qoder-cn/config.json',
    macos: '~/Library/Application Support/QoderCN/config.json',
    windows: '~/AppData/Roaming/QoderCN/config.json',
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
