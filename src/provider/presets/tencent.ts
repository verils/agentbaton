import type { ProviderPreset } from '../../types';

export const tencent: ProviderPreset = {
  id: 'tencent',
  name: '腾讯云',
  apiType: 'openai',
  baseUrl: 'https://api.lkeap.cloud.tencent.com/v1',
  models: [
    {
      id: 'deepseek-r1',
      name: 'DeepSeek R1',
    },
    {
      id: 'deepseek-v3',
      name: 'DeepSeek V3',
    },
  ],
};
