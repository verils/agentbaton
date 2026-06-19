import type { ProviderPreset } from '../../types';

export const moonshot: ProviderPreset = {
  id: 'moonshot',
  name: '月之暗面',
  pricing: [
    {
      id: 'default',
      name: '默认',
      endpoints: {
        openai: { apiType: 'openai', baseUrl: 'https://api.moonshot.cn/v1' },
      },
    },
  ],
  models: [
    {
      id: 'moonshot-v1-8k',
      name: 'Moonshot V1 8K',
    },
    {
      id: 'moonshot-v1-32k',
      name: 'Moonshot V1 32K',
    },
    {
      id: 'moonshot-v1-128k',
      name: 'Moonshot V1 128K',
    },
  ],
};
