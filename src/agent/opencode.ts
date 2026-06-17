import type { AgentNativeConfig, AgentProviderBinding, AgentDefinition, AgentModel } from '../types';
import { expandHome } from '../utils';
import { readJson, writeJson } from '../config';

interface OpenCodeProviderOptions {
  apiKey?: string;
  baseURL?: string;
  [key: string]: unknown;
}

interface OpenCodeProviderConfig {
  name?: string;
  npm?: string;
  options?: OpenCodeProviderOptions;
  models?: Record<string, { name?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

interface OpenCodeConfig {
  $schema?: string;
  model?: string;
  small_model?: string;
  provider?: Record<string, OpenCodeProviderConfig>;
  [key: string]: unknown;
}

export const opencode: AgentDefinition = {
  id: 'opencode',
  name: 'OpenCode',
  command: 'opencode',
  apiType: 'openai',
  multiProvider: true,
  home: {
    linux: '~/.config/opencode/opencode.json',
    macos: '~/.config/opencode/opencode.json',
    windows: '~/.config/opencode/opencode.json',
  },
  models: [
    {
      slot: 'default',
      name: 'model',
      description: '默认模型',
    },
  ],
  async loadNativeConfig(): Promise<AgentNativeConfig> {
    const filePath = expandHome(this.home!.linux);
    const config = await readJson<OpenCodeConfig>(filePath);

    const models: AgentModel[] = [];
    if (config?.model) {
      models.push({ slot: 'default', id: config.model });
    }

    const providers: Record<string, AgentProviderBinding> = {};
    if (config?.provider) {
      for (const [key, p] of Object.entries(config.provider)) {
        providers[key] = {
          apiKey: p.options?.apiKey,
          baseUrl: p.options?.baseURL,
        };
      }
    }

    return { models, providers };
  },
  async saveNativeConfig(config: AgentNativeConfig): Promise<void> {
    const filePath = expandHome(this.home!.linux);
    const ocConfig = await readJson<OpenCodeConfig>(filePath) ?? {} as OpenCodeConfig;

    if (config.models) {
      const defaultModel = config.models.find(m => m.slot === 'default');
      if (defaultModel) {
        ocConfig.model = defaultModel.id;
      }
    }

    if (config.providers) {
      if (!ocConfig.provider) {
        ocConfig.provider = {};
      }
      for (const [key, binding] of Object.entries(config.providers)) {
        if (!ocConfig.provider[key]) {
          ocConfig.provider[key] = {};
        }
        const provider = ocConfig.provider[key];
        if (!provider.options) {
          provider.options = {};
        }
        if (binding.apiKey) {
          provider.options.apiKey = binding.apiKey;
        }
        if (binding.baseUrl) {
          provider.options.baseURL = binding.baseUrl;
        }
      }
    }

    await writeJson(filePath, ocConfig);
  },
};
