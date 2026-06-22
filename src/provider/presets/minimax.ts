import type { ProviderPreset } from '../../types/index.js';

export const minimax: ProviderPreset = {
  id: 'minimax',
  name: 'MiniMax',
  pricing: [
    {
      id: 'default',
      name: '默认',
      endpoints: {
        openai: { apiType: 'openai', baseUrl: 'https://api.minimax.chat/v1' },
      },
    },
  ],
  models: [
    {
      id: 'MiniMax-Text-01',
      name: 'MiniMax Text 01',
    },
  ],
};
