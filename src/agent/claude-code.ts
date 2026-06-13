import { AgentConfig, AgentDefinition, AgentModel } from '../types';
import { expandHome, getCurrentPlatformConfigPath } from "../utils";
import { readJson, writeJson } from "../config";

interface AnthropicConfig {
  env: {
    "ANTHROPIC_AUTH_TOKEN": string,
    "ANTHROPIC_BASE_URL": string,
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": string,
    "ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME": string,
    "ANTHROPIC_DEFAULT_OPUS_MODEL": string,
    "ANTHROPIC_DEFAULT_OPUS_MODEL_NAME": string,
    "ANTHROPIC_DEFAULT_SONNET_MODEL": string,
    "ANTHROPIC_DEFAULT_SONNET_MODEL_NAME": string,
  }
}

export const claudeCode: AgentDefinition = {
  id: 'claude-code',
  name: 'Claude Code',
  command: 'claude',
  apiType: 'anthropic',
  home: {
    linux: '~/.claude',
    macos: '~/.claude',
    windows: '~/.claude',
  },
  models: [
    {
      slot: 'opus',
      name: 'Claude Opus',
    },
    {
      slot: 'sonnet',
      name: 'Claude Sonnet',
    },
    {
      slot: 'haiku',
      name: 'Claude Haiku',
    },
  ],
  async parseConfig(): Promise<AgentConfig> {
    const configDir = expandHome(getCurrentPlatformConfigPath(this.home!!));
    const anthropicConfig = await readJson<AnthropicConfig>(getConfigFilePath(configDir));

    const env = anthropicConfig?.env;

    const models: AgentModel[] = [];
    if (env?.ANTHROPIC_DEFAULT_OPUS_MODEL) {
      models.push({
        slot: 'opus',
        id: env.ANTHROPIC_DEFAULT_OPUS_MODEL,
      });
    }
    if (env?.ANTHROPIC_DEFAULT_SONNET_MODEL) {
      models.push({
        slot: 'sonnet',
        id: env.ANTHROPIC_DEFAULT_SONNET_MODEL,
      });
    }
    if (env?.ANTHROPIC_DEFAULT_HAIKU_MODEL) {
      models.push({
        slot: 'haiku',
        id: env.ANTHROPIC_DEFAULT_HAIKU_MODEL,
      });
    }

    return {
      baseUrl: env?.ANTHROPIC_BASE_URL,
      apiKey: env?.ANTHROPIC_AUTH_TOKEN,
      models: models,
    };
  },
  async saveConfig(config: AgentConfig) {
    const configDir = expandHome(getCurrentPlatformConfigPath(this.home!!));
    const configFile = getConfigFilePath(configDir);
    const anthropicConfig = await readJson<Record<string, unknown>>(configFile) ?? {};

    const envElement = anthropicConfig['env'] as Record<string, string> ?? (anthropicConfig['env'] = {});
    if (config.baseUrl) {
      envElement['ANTHROPIC_BASE_URL'] = config.baseUrl;
    }
    if (config.apiKey) {
      envElement['ANTHROPIC_AUTH_TOKEN'] = config.apiKey;
    }
    if (config.models) {
      const opusModel = config.models.find(m => m.slot === 'opus');
      if (opusModel) {
        envElement['ANTHROPIC_DEFAULT_OPUS_MODEL'] = opusModel.id;
      }
      const sonnetModel = config.models.find(m => m.slot === 'sonnet');
      if (sonnetModel) {
        envElement['ANTHROPIC_DEFAULT_SONNET_MODEL'] = sonnetModel.id;
      }
      const haikuModel = config.models.find(m => m.slot === 'haiku');
      if (haikuModel) {
        envElement['ANTHROPIC_DEFAULT_HAIKU_MODEL'] = haikuModel.id;
      }
    }
    await writeJson(configFile, anthropicConfig);
  }
};

function getConfigFilePath(configDir: string) {
  return `${configDir}/settings.json`;
}
