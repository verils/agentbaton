import type { AgentConfig, AgentDefinition, AgentModel } from '../types';
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
  async loadConfig(): Promise<AgentConfig | null> {
    const configDir = resolvePlatformHome(this.home!);
    const settings = await readJson<QwenSettings>(getConfigFilePath(configDir));
    if (!settings) {
      return null;
    }

    const apiKey = settings.env?.CUSTOM_API_KEY;
    const providers = settings.modelProviders?.openai;
    const baseUrl = providers?.[0]?.baseUrl;

    const models: AgentModel[] = [];
    if (settings.model?.name) {
      models.push({ slot: 'default', id: settings.model.name });
    }

    return {
      baseUrl: baseUrl || undefined,
      apiKey: apiKey || undefined,
      models,
    };
  },
  async saveConfig(config: AgentConfig): Promise<void> {
    const configDir = resolvePlatformHome(this.home!);
    const configFile = getConfigFilePath(configDir);
    const settings = await readJson<QwenSettings>(configFile) ?? {};

    if (!settings.env) {
      settings.env = {};
    }
    if (config.apiKey) {
      settings.env.CUSTOM_API_KEY = config.apiKey;
    }

    if (config.baseUrl) {
      if (!settings.modelProviders) {
        settings.modelProviders = {};
      }
      if (!settings.modelProviders.openai) {
        settings.modelProviders.openai = [];
      }
      if (settings.modelProviders.openai.length > 0) {
        settings.modelProviders.openai[0].baseUrl = config.baseUrl;
      } else {
        settings.modelProviders.openai.push({
          id: 'custom',
          name: 'Custom',
          baseUrl: config.baseUrl,
          envKey: 'CUSTOM_API_KEY',
        });
      }
    }

    if (config.models) {
      const defaultModel = config.models.find(m => m.slot === 'default');
      if (defaultModel) {
        if (!settings.model) {
          settings.model = {};
        }
        settings.model.name = defaultModel.id;
      }
    }

    await writeJson(configFile, settings);
  },
};
