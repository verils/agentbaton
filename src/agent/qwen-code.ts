import type { AgentNativeConfig, AgentDefinition, AgentModel } from '../types';
import { resolvePlatformHome } from '../utils';
import { readJson, writeJson } from '../config';

interface QwenModelProvider {
  id: string;
  name: string;
  baseUrl: string;
  envKey: string;
}

interface QwenSettings {
  env?: Record<string, string>;
  modelProviders?: {
    openai?: QwenModelProvider[];
  };
  model?: {
    name?: string;
  };
  [key: string]: unknown;
}

function getConfigFilePath(configDir: string): string {
  return `${configDir}/settings.json`;
}

export const qwenCode: AgentDefinition = {
  id: 'qwen-code',
  name: 'Qwen Code',
  command: 'qwen',
  apiType: 'openai',
  multiProvider: true,
  home: {
    linux: '~/.qwen',
    macos: '~/.qwen',
    windows: '~/.qwen',
  },
  models: [
    {
      slot: 'default',
      name: 'model',
      description: '默认模型',
    },
  ],
  async loadNativeConfig(): Promise<AgentNativeConfig> {
    const configDir = resolvePlatformHome(this.home!);
    const settings = await readJson<QwenSettings>(getConfigFilePath(configDir));

    const models: AgentModel[] = [];
    if (settings?.model?.name) {
      models.push({ slot: 'default', id: settings.model.name });
    }

    const providers: Record<string, { apiKey?: string; baseUrl?: string }> = {};
    const qwenProviders = settings?.modelProviders?.openai ?? [];
    for (const p of qwenProviders) {
      providers[p.id] = {
        apiKey: settings?.env?.[p.envKey] || undefined,
        baseUrl: p.baseUrl || undefined,
      };
    }

    return { models, providers };
  },
  async saveNativeConfig(config: AgentNativeConfig): Promise<void> {
    const configDir = resolvePlatformHome(this.home!);
    const configFile = getConfigFilePath(configDir);
    const settings = await readJson<QwenSettings>(configFile) ?? {};

    if (config.models) {
      const defaultModel = config.models.find(m => m.slot === 'default');
      if (defaultModel) {
        if (!settings.model) {
          settings.model = {};
        }
        settings.model.name = defaultModel.id;
      }
    }

    if (config.providers) {
      if (!settings.env) {
        settings.env = {};
      }
      if (!settings.modelProviders) {
        settings.modelProviders = {};
      }
      if (!settings.modelProviders.openai) {
        settings.modelProviders.openai = [];
      }

      const existing = settings.modelProviders.openai;
      settings.modelProviders.openai = [];

      for (const [providerKey, binding] of Object.entries(config.providers)) {
        const matched = existing.find(p => p.id === providerKey);
        if (matched) {
          if (binding.apiKey) {
            settings.env[matched.envKey] = binding.apiKey;
          }
          if (binding.baseUrl) {
            matched.baseUrl = binding.baseUrl;
          }
          settings.modelProviders.openai.push(matched);
        } else {
          const envKey = `CUSTOM_API_KEY_${providerKey.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
          if (binding.apiKey) {
            settings.env[envKey] = binding.apiKey;
          }
          settings.modelProviders.openai.push({
            id: providerKey,
            name: providerKey,
            baseUrl: binding.baseUrl ?? '',
            envKey,
          });
        }
      }
    }

    await writeJson(configFile, settings);
  },
};
