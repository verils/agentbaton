import type { AgentDefinition, AgentNativeConfig, AgentModel, AgentProviderBinding } from '../types/index.js';
import { resolvePlatformHome } from '../utils/index.js';
import { readJson, writeJson } from '../config/index.js';

interface ClineProviderSettings {
  provider?: string;
  apiKey?: string;
  model?: string;
  reasoning?: {
    enabled?: boolean;
    effort?: string;
  };
  [key: string]: unknown;
}

interface ClineProviderEntry {
  settings?: ClineProviderSettings;
  updatedAt?: string;
  tokenSource?: string;
  [key: string]: unknown;
}

interface ClineProvidersConfig {
  version?: number;
  lastUsedProvider?: string;
  providers?: Record<string, ClineProviderEntry>;
  [key: string]: unknown;
}

export const cline: AgentDefinition = {
  id: 'cline',
  name: 'Cline',
  command: 'cline',
  apiType: 'openai',
  multiProvider: true,
  home: {
    linux: '~/.cline',
    macos: '~/.cline',
    windows: '~/.cline',
  },
  models: [
    {
      slot: 'default',
      name: 'Default',
    },
  ],
  async loadNativeConfig(): Promise<AgentNativeConfig | null> {
    const configDir = resolvePlatformHome(this.home!);
    const config = await readJson<ClineProvidersConfig>(`${configDir}/data/settings/providers.json`);

    if (!config) {
      return null;
    }

    const lastUsed = config.lastUsedProvider;
    const lastUsedEntry = lastUsed ? config.providers?.[lastUsed] : undefined;

    const models: AgentModel[] = [];
    if (lastUsedEntry?.settings?.model) {
      models.push({ slot: 'default', id: lastUsedEntry.settings.model });
    }

    const providers: Record<string, AgentProviderBinding> = {};
    if (config.providers) {
      for (const [key, entry] of Object.entries(config.providers)) {
        providers[key] = {
          apiKey: entry.settings?.apiKey,
        };
      }
    }

    return {
      apiKey: lastUsedEntry?.settings?.apiKey,
      models,
      providers,
    };
  },
  async saveNativeConfig(config: AgentNativeConfig): Promise<void> {
    const configDir = resolvePlatformHome(this.home!);
    const filePath = `${configDir}/data/settings/providers.json`;
    const clineConfig = await readJson<ClineProvidersConfig>(filePath) ?? {} as ClineProvidersConfig;

    if (!clineConfig.providers) {
      clineConfig.providers = {};
    }

    const lastUsed = clineConfig.lastUsedProvider ?? 'default';

    if (config.apiKey) {
      if (!clineConfig.providers[lastUsed]) {
        clineConfig.providers[lastUsed] = {};
      }
      if (!clineConfig.providers[lastUsed].settings) {
        clineConfig.providers[lastUsed].settings = {};
      }
      clineConfig.providers[lastUsed].settings!.apiKey = config.apiKey;
    }

    if (config.models) {
      const defaultModel = config.models.find(m => m.slot === 'default');
      if (defaultModel) {
        if (!clineConfig.providers[lastUsed]) {
          clineConfig.providers[lastUsed] = {};
        }
        if (!clineConfig.providers[lastUsed].settings) {
          clineConfig.providers[lastUsed].settings = {};
        }
        clineConfig.providers[lastUsed].settings!.model = defaultModel.id;
      }
    }

    if (config.providers) {
      for (const [key, binding] of Object.entries(config.providers)) {
        if (!clineConfig.providers[key]) {
          clineConfig.providers[key] = {};
        }
        if (!clineConfig.providers[key].settings) {
          clineConfig.providers[key].settings = {};
        }
        const settings = clineConfig.providers[key].settings!;
        if (binding.apiKey) {
          settings.apiKey = binding.apiKey;
        }
        if (binding.models && binding.models.length > 0) {
          settings.model = binding.models[0].id;
        }
      }
    }

    await writeJson(filePath, clineConfig);
  },
};
