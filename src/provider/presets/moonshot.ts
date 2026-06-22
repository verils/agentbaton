import type { ProviderPreset } from '../../types/index.js';

export const moonshot: ProviderPreset = {
  id: 'moonshot',
  name: '月之暗面',
  pricing: [
    {
      id: 'default',
      name: '默认',
      endpoints: {
        openai: { apiType: 'openai', baseUrl: 'https://api.moonshot.cn/v1' },
        anthropic: { apiType: 'anthropic', baseUrl: 'https://api.moonshot.cn/anthropic' },
      },
    },
  ],
  models: [
    {
      id: 'kimi-k2.7-code',
      name: 'Kimi K2.7 Code',
      contextWindowSize: 1000000
    },
    {
      id: 'kimi-k2.7-code-highspeed',
      name: 'Kimi K2.7 Code HighSpeed',
      contextWindowSize: 1000000
    },
    {
      id: 'kimi-k2.6',
      name: 'Kimi K2.6',
      contextWindowSize: 1000000
    },
    {
      id: 'kimi-k2.5',
      name: 'Kimi K2.5',
      contextWindowSize: 1000000
    }
  ],
};
