import type { AgentNativeConfig, AgentDefinition, AgentModel } from '../types';
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

    const providerKey = config?.model?.split('/')[0];
    const provider = providerKey ? config?.provider?.[providerKey] : undefined;

    return {
      baseUrl: provider?.options?.baseURL,
      apiKey: provider?.options?.apiKey,
      models,
    };
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

    const providerKey = ocConfig.model?.split('/')[0];
    if (providerKey) {
      if (!ocConfig.provider) {
        ocConfig.provider = {};
      }
      if (!ocConfig.provider[providerKey]) {
        ocConfig.provider[providerKey] = {};
      }
      const provider = ocConfig.provider[providerKey];
      if (!provider.options) {
        provider.options = {};
      }
      if (config.apiKey) {
        provider.options.apiKey = config.apiKey;
      }
      if (config.baseUrl) {
        provider.options.baseURL = config.baseUrl;
      }
    }

    await writeJson(filePath, ocConfig);
  },
};
