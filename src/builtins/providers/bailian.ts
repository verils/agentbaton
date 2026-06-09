import type { ProviderDefinition } from '../../types/provider.js';

export const bailian: ProviderDefinition = {
  name: 'bailian',
  displayName: '百炼 (Bailian)',
  apiType: 'openai',
  baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  models: [
    {
      name: 'qwen-turbo',
      description: '通义千问 Turbo',
    },
    {
      name: 'qwen-plus',
      description: '通义千问 Plus',
    },
    {
      name: 'qwen-max',
      description: '通义千问 Max',
    },
  ],
};
