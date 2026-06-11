import type { ProviderTemplate } from '../types';

export const deepseek: ProviderTemplate = {
  id: 'deepseek',
  name: 'DeepSeek',
  apiType: 'openai',
  baseUrl: 'https://api.deepseek.com',
  models: [
    {
      name: 'deepseek-chat',
      description: 'DeepSeek Chat',
    },
    {
      name: 'deepseek-reasoner',
      description: 'DeepSeek Reasoner',
    },
  ],
};
