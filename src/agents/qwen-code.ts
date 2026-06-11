import type { AgentDefinition } from '../types';

export const qwenCode: AgentDefinition = {
  name: 'qwen-code',
  displayName: 'Qwen Code',
  command: 'qwen',
  apiType: 'openai',
  configPath: {
    linux: '~/.config/qwen/config.json',
    macos: '~/Library/Application Support/Qwen/config.json',
    windows: '~/AppData/Roaming/Qwen/config.json',
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
