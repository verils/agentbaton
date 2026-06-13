import type { ProviderPreset } from '../../types';

export const minimax: ProviderPreset = {
  id: 'minimax',
  name: 'MiniMax',
  apiType: 'openai',
  baseUrl: 'https://api.minimax.chat/v1',
  models: [
    {
      id: 'MiniMax-Text-01',
      name: 'MiniMax Text 01',
    },
  ],
};
