import type { ProviderPreset } from '../../types';

export const zhipu: ProviderPreset = {
  id: 'zhipu',
  name: '智谱 AI',
  apiType: 'openai',
  baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  models: [
    {
      id: 'glm-4-flash',
      name: 'GLM-4 Flash',
    },
    {
      id: 'glm-4-plus',
      name: 'GLM-4 Plus',
    },
  ],
};
