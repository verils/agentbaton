import type { ProviderDefinition } from '../types';

export const xiaomiMimo: ProviderDefinition = {
  name: 'xiaomi-mimo',
  displayName: '小米 MiMo',
  apiType: 'openai',
  baseUrl: 'https://api.xiaomi.com/v1',
  models: [
    {
      name: 'mimo-7b',
      description: 'MiMo 7B',
    },
  ],
};
