import type { AgentDefinition } from '../types';

export const geminiCli: AgentDefinition = {
  id: 'gemini-cli',
  name: 'Gemini CLI',
  command: 'gemini',
  apiType: 'google',
  home: {
    linux: '~/.gemini/settings.json',
    macos: '~/.gemini/settings.json',
    windows: '~/AppData/Roaming/gemini/settings.json',
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
