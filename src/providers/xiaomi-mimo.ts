import type { ProviderTemplate } from '../types';

export const xiaomiMimo: ProviderTemplate = {
  id: 'xiaomi-mimo',
  name: '小米 MiMo',
  apiType: 'openai',
  baseUrl: 'https://api.xiaomi.com/v1',
  models: [
    {
      name: 'mimo-7b',
      description: 'MiMo 7B',
    },
  ],
};
