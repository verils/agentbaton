import type { AgentBatonConfig } from '../../types/index.js';

export function findProvider(config: AgentBatonConfig, providerId: string) {
  return config.providers.find(p => p.id === providerId);
}
