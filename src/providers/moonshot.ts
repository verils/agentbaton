import type { ProviderTemplate } from '../types';

export const moonshot: ProviderTemplate = {
  id: 'moonshot',
  name: '月之暗面',
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
