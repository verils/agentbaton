import type { ProviderTemplate } from '../types';

export const xiaomiMimo: ProviderTemplate = {
  id: 'xiaomi-mimo',
  name: '小米 MiMo',
  endpoints: {
    'openai': {
      apiType: 'openai',
      baseUrl: 'https://api.xiaomimimo.com/v1'
    },
    'anthropic': {
      apiType: 'anthropic',
      baseUrl: 'https://api.xiaomimimo.com/anthropic'
    }
  },
  models: [
    {
      id: 'mimo-v2.5-pro',
      name: 'MiMo-V2.5-Pro',
      contextWindowSize: 1000000
    },
    {
      id: 'mimo-v2.5',
      name: 'MiMo-V2.5',
      contextWindowSize: 1000000
    },
  ],
};
