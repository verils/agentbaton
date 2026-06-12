import type { ProviderPreset } from '../../types';

export const xiaomiMimo: ProviderPreset = {
  id: 'xiaomi-mimo',
  name: '小米 MiMo',
  pricing: [
    {
      id: 'default',
      name: '按量付费',
      endpoints: {
        'openai': {
          apiType: 'openai',
          baseUrl: 'https://api.xiaomimimo.com/v1'
        },
        'anthropic': {
          apiType: 'anthropic',
          baseUrl: 'https://api.xiaomimimo.com/anthropic'
        }
      }
    },
    {
      id: 'token-plan',
      name: 'Token Plan',
      endpoints: {
        'openai': {
          apiType: 'openai',
          baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1'
        },
        'anthropic': {
          apiType: 'anthropic',
          baseUrl: 'https://token-plan-cn.xiaomimimo.com/anthropic'
        }
      }
    }
  ],
  models: [
    {
      id: 'mimo-v2.5-pro',
      name: 'MiMo-V2.5-Pro',
      contextWindowSize: 1000000
    },
    {
      id: 'mimo-v2.5',
      name: 'MiMo-V2.5',
      contextWindowSize: 1000000
    },
  ],
};
