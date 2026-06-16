import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { AgentConfig, AgentConfigPaths, AgentDefinition, AgentModel } from '../types';
import { resolvePlatformHome } from '../utils';

const ENV_KEYS = {
  apiKey: 'GEMINI_API_KEY',
  model: 'GEMINI_MODEL',
  baseUrl: 'GOOGLE_GEMINI_BASE_URL',
} as const;

function getEnvFilePath(home: AgentConfigPaths): string {
  return `${resolvePlatformHome(home)}/.env`;
}

async function readEnvFile(filePath: string): Promise<Record<string, string>> {
  if (!existsSync(filePath)) {
    return {};
  }
  const content = await readFile(filePath, 'utf-8');
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    result[key] = value;
  }
  return result;
}

export const geminiCli: AgentDefinition = {
  id: 'gemini-cli',
  name: 'Gemini CLI',
  command: 'gemini',
  apiType: 'google',
  home: {
    linux: '~/.gemini',
    macos: '~/.gemini',
    windows: '~/.gemini',
  },
  models: [
    {
      slot: 'default',
      name: 'model',
      description: '默认模型',
    },
  ],
  async loadConfig(): Promise<AgentConfig | null> {
    const envPath = getEnvFilePath(this.home!);
    const env = await readEnvFile(envPath);
    if (!Object.keys(env).length) {
      return null;
    }

    const models: AgentModel[] = [];
    if (env[ENV_KEYS.model]) {
      models.push({ slot: 'default', id: env[ENV_KEYS.model] });
    }

    return {
      apiKey: env[ENV_KEYS.apiKey] || undefined,
      baseUrl: env[ENV_KEYS.baseUrl] || undefined,
      models,
    };
  },
  async saveConfig(config: AgentConfig): Promise<void> {
    const envPath = getEnvFilePath(this.home!);
    const env = await readEnvFile(envPath);

    if (config.apiKey) {
      env[ENV_KEYS.apiKey] = config.apiKey;
    }
    if (config.baseUrl) {
      env[ENV_KEYS.baseUrl] = config.baseUrl;
    }
    if (config.models) {
      const defaultModel = config.models.find(m => m.slot === 'default');
      if (defaultModel) {
        env[ENV_KEYS.model] = defaultModel.id;
      }
    }

    const lines = Object.entries(env).map(([k, v]) => `${k}=${v}`);
    await writeFile(envPath, lines.join('\n') + '\n', 'utf-8');
  },
};
