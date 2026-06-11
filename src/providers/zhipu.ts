import type { ProviderTemplate } from '../types';

export const zhipu: ProviderTemplate = {
  id: 'zhipu',
  name: '智谱 AI',
  apiType: 'openai',
  baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  models: [
    {
      name: 'glm-4-flash',
      description: 'GLM-4 Flash',
    },
    {
      name: 'glm-4-plus',
      description: 'GLM-4 Plus',
    },
  ],
};
