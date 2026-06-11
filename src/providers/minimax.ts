import type { ProviderDefinition } from '../types';

export const minimax: ProviderDefinition = {
  id: 'minimax',
  name: 'MiniMax',
  apiType: 'openai',
  baseUrl: 'https://api.minimax.chat/v1',
  models: [
    {
      name: 'MiniMax-Text-01',
      description: 'MiniMax Text 01',
    },
  ],
};
