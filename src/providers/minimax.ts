import type { ProviderDefinition } from '../types';

export const minimax: ProviderDefinition = {
  name: 'minimax',
  displayName: 'MiniMax',
  apiType: 'openai',
  baseUrl: 'https://api.minimax.chat/v1',
  models: [
    {
      name: 'MiniMax-Text-01',
      description: 'MiniMax Text 01',
    },
  ],
};
