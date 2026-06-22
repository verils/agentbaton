import { ApiType, ProviderModel, ProviderPreset } from "../../types/index.js";

const FALLBACK_MODELS: ProviderModel[] = [
  {
    id: 'qwen3.7-max',
    name: 'Qwen3.7 Max',
    contextWindowSize: 1000000
  },
  {
    id: 'qwen3.7-plus',
    name: 'Qwen3.7 Plus',
    contextWindowSize: 1000000
  },
  {
    id: 'qwen3.6-flash',
    name: 'Qwen3.6 Flash',
    contextWindowSize: 1000000
  },
  {
    id: 'glm-5.1',
    name: 'GLM-5.1',
    contextWindowSize: 256000
  },
  {
    id: 'deepseek v4 pro',
    name: 'DeepSeek V4 Pro',
    contextWindowSize: 1000000
  },
  {
    id: 'deepseek-v4-flash',
    name: 'DeepSeek V4 Flash',
    contextWindowSize: 1000000
  }

];

interface BailianModelItem {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
}

interface BailianModelList {
  object: 'list';
  data: BailianModelItem[];
  first_id: string;
  last_id: string;
  has_more: boolean;
}

export const bailian: ProviderPreset = {
  id: 'bailian',
  name: '阿里云百炼',
  pricing: [
    {
      id: 'default',
      name: '按量付费',
      endpoints: {
        'openai': {
          apiType: 'openai',
          baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        },
        'anthropic': {
          apiType: 'anthropic',
          baseUrl: 'https://dashscope.aliyuncs.com/apps/anthropic',
        },
      }
    },
    {
      id: 'coding-plan',
      name: 'Coding Plan',
      endpoints: {
        'openai': {
          apiType: 'openai',
          baseUrl: 'https://coding.dashscope.aliyuncs.com/v1',
        },
        'anthropic': {
          apiType: 'anthropic',
          baseUrl: 'https://coding.dashscope.aliyuncs.com/apps/anthropic',
        },
      }
    },
    {
      id: 'token-plan',
      name: 'Token Plan',
      endpoints: {
        'openai': {
          apiType: 'openai',
          baseUrl: 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
        },
        'anthropic': {
          apiType: 'anthropic',
          baseUrl: 'https://token-plan.cn-beijing.maas.aliyuncs.com/apps/anthropic',
        },
      }
    }
  ],
  async fetchModels(apiType: ApiType, baseUrl: string, apiKey: string): Promise<ProviderModel[]> {
    if (apiType === 'openai') {
      try {
        const res = await fetch(`${baseUrl}/models`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });

        if (res.ok) {
          const json = await res.json() as BailianModelList;
          return json.data.map((item) => ({ id: item.id, name: item.id }));
        }
      } catch { /* fallback to static models */ }
    }

    return FALLBACK_MODELS;
  },
};
