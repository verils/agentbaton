import type { ProviderPreset } from '../../types';

export const deepseek: ProviderPreset = {
  id: 'deepseek',
  name: 'DeepSeek',
  endpoints: {
    'openai': {
      apiType: 'openai',
      baseUrl: 'https://api.deepseek.com'
    },
    'anthropic': {
      apiType: 'anthropic',
      baseUrl: 'https://api.deepseek.com/anthropic'
    }
  },
  models: [
    {
      id: 'deepseek-v4-pro',
      name: 'DeepSeek-V4-Pro',
      contextWindowSize: 1000000
    },
    {
      id: 'deepseek-v4-flash',
      name: 'DeepSeek-V4-Flash',
      contextWindowSize: 1000000
    },
  ],
};
