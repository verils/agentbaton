import { ProviderModel, ProviderTemplate } from "../types";

export const bailian: ProviderTemplate = {
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
  async fetchModels(): Promise<ProviderModel[]> {
    return []
  },
  models: [
    {
      id: 'qwen3.7-max',
      name: 'Qwen3.7-Max',
      contextWindowSize: 1000000
    },
    {
      id: 'qwen3.7-plus',
      name: 'qwen3.7-plus',
      contextWindowSize: 1000000
    },
    {
      id: 'qwen3.6-flash',
      name: 'qwen3.6-flash',
      contextWindowSize: 1000000
    },
    {
      id: 'glm-5.1',
      name: 'GLM-5.1',
      contextWindowSize: 256000
    }
  ]
};
