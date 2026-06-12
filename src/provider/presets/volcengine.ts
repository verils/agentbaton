import type { ProviderPreset } from '../../types';

export const volcengine: ProviderPreset = {
  id: 'volcengine',
  name: '火山引擎',
  apiType: 'openai',
  baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
  models: [
    {
      name: 'doubao-1.5-pro-32k',
      description: '豆包 1.5 Pro 32K',
    },
    {
      name: 'doubao-1.5-pro-128k',
      description: '豆包 1.5 Pro 128K',
    },
  ],
};
