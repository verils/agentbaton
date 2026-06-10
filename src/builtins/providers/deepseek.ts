import type { ProviderDefinition } from '../../types/provider';

export const deepseek: ProviderDefinition = {
  name: 'deepseek',
  displayName: 'DeepSeek',
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
