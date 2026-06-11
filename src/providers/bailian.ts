import { ProviderDefinition } from "../types";

export const bailian: ProviderDefinition = {
  id: 'bailian',
  name: '阿里云百炼',
  endpoints: {
    'openai': {
      apiType: 'openai',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    },
    'anthropic': {
      apiType: 'anthropic',
      baseUrl: 'https://dashscope.aliyuncs.com/apps/anthropic',
    },
  },
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
  ]
};
