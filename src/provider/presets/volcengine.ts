import type {ProviderPreset} from '../../types';

export const volcengine: ProviderPreset = {
  id: 'volcengine',
  name: '火山引擎',
  pricing: [
    {
      id: 'default',
      name: '按量付费',
      endpoints: {
        'openai': {
          apiType: 'openai',
          baseUrl: 'https://ark.cn-beijing.volces.com/api/v3'
        },
        'anthropic': {
          apiType: 'anthropic',
          baseUrl: 'https://ark.cn-beijing.volces.com/api/compatible'
        }
      }
    },
    {
      id: 'coding-plan',
      name: 'Coding Plan',
      endpoints: {
        'openai': {
          apiType: 'openai',
          baseUrl: 'https://ark.cn-beijing.volces.com/api/coding/v3'
        },
        'anthropic': {
          apiType: 'anthropic',
          baseUrl: 'https://ark.cn-beijing.volces.com/api/coding'
        }
      }
    },
    {
      id: 'agent-plan',
      name: 'Agent Plan',
      endpoints: {
        'openai': {
          apiType: 'openai',
          baseUrl: 'https://ark.cn-beijing.volces.com/api/plan/v3'
        },
        'anthropic': {
          apiType: 'anthropic',
          baseUrl: 'https://ark.cn-beijing.volces.com/api/plan'
        }
      }
    }
  ],
  models: [
    {
      id: 'doubao-seed-2.0-pro',
      name: 'Doubao-Seed-2.0-Pro',
      contextWindowSize: 256000
    },
    {
      id: 'doubao-seed-2.0-lite',
      name: 'Doubao-Seed-2.0-Lite',
      contextWindowSize: 256000
    },
    {
      id: 'doubao-seed-2.0-mini',
      name: 'Doubao-Seed-2.0-Mini',
      contextWindowSize: 256000
    },
    {
      id: 'deepseek-v4-pro',
      name: 'DeepSeek-V4-Pro',
      contextWindowSize: 1000000
    },
    {
      id: 'deepseek-v4-flash',
      name: 'DeepSeek-V4-Flash',
      contextWindowSize: 1000000
    },
  ],
};
