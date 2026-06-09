import type { ProviderDefinition } from '../../types/provider.js';

export const moonshot: ProviderDefinition = {
  name: 'moonshot',
  displayName: '月之暗面 (Moonshot)',
  apiType: 'openai',
  baseUrl: 'https://api.moonshot.cn/v1',
  models: [
    {
      name: 'moonshot-v1-8k',
      description: 'Moonshot V1 8K',
    },
    {
      name: 'moonshot-v1-32k',
      description: 'Moonshot V1 32K',
    },
    {
      name: 'moonshot-v1-128k',
      description: 'Moonshot V1 128K',
    },
  ],
};
