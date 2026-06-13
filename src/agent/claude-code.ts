import { AgentConfig, AgentDefinition, AgentModel } from '../types';
import { expandHome, getConfigPath } from "../utils";
import { readJson, writeJson } from "../config";

interface AnthropicConfig {
  env: {
    "ANTHROPIC_API_KEY": string,
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
  configPaths: {
    linux: '~/.claude/settings.json',
    macos: '~/.claude/settings.json',
    windows: '~/.claude/settings.json',
  },
  configFormat: 'json',
  models: [
    {
      slot: 'opus',
      name: 'Claude Opus',
      description: 'Claude Opus 模型',
    },
    {
      slot: 'sonnet',
      name: 'Claude Sonnet',
      description: 'Claude Sonnet 模型',
    },
    {
      slot: 'haiku',
      name: 'Claude Haiku',
      description: 'Claude Haiku 模型',
    },
  ],
  async parseConfig(): Promise<AgentConfig> {
    const configPath = expandHome(getConfigPath(this.configPaths));
    const anthropicConfig = await readJson<AnthropicConfig>(configPath);
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
      apiKey: env?.ANTHROPIC_API_KEY,
      models: models,
    };
  },
  async saveConfig(config: AgentConfig) {
    const configPath = expandHome(getConfigPath(this.configPaths));
    const anthropicConfig = await readJson<Record<string, unknown>>(configPath) ?? {};
    const envElement = anthropicConfig['env'] as Record<string, string> ?? (anthropicConfig['env'] = {});
    if (config.baseUrl) {
      envElement['ANTHROPIC_BASE_URL'] = config.baseUrl;
    }
    if (config.apiKey) {
      envElement['ANTHROPIC_API_KEY'] = config.apiKey;
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
    await writeJson(configPath, anthropicConfig);
  }
};
