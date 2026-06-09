import type { ProviderDefinition } from '../../types/provider.js';

export const tencent: ProviderDefinition = {
  name: 'tencent',
  displayName: '腾讯云',
  apiType: 'openai',
  baseUrl: 'https://api.lkeap.cloud.tencent.com/v1',
  models: [
    {
      name: 'deepseek-r1',
      description: 'DeepSeek R1',
    },
    {
      name: 'deepseek-v3',
      description: 'DeepSeek V3',
    },
  ],
};
