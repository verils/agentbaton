import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { AgentNativeConfig, AgentNativePaths, AgentDefinition, AgentModel } from '../types/index.js';
import { resolvePlatformHome } from '../utils/index.js';

const GOOGLE_GEMINI_BASE_URL = 'GOOGLE_GEMINI_BASE_URL';
const GEMINI_API_KEY = 'GEMINI_API_KEY';
const GEMINI_MODEL = 'GEMINI_MODEL';

function getEnvFilePath(home: AgentNativePaths): string {
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
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, eqIndex).trim();
    result[key] = trimmed.slice(eqIndex + 1).trim();
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
      name: 'Default',
    },
  ],
  async loadNativeConfig(): Promise<AgentNativeConfig | null> {
    const envPath = getEnvFilePath(this.home!);
    const env = await readEnvFile(envPath);
    if (!Object.keys(env).length) {
      return null;
    }

    const models: AgentModel[] = [];
    if (env[GEMINI_MODEL]) {
      models.push({ slot: 'default', id: env[GEMINI_MODEL] });
    }

    return {
      apiKey: env[GEMINI_API_KEY] || undefined,
      baseUrl: env[GOOGLE_GEMINI_BASE_URL] || undefined,
      models,
    };
  },
  async saveNativeConfig(config: AgentNativeConfig): Promise<void> {
    const envPath = getEnvFilePath(this.home!);
    const env = await readEnvFile(envPath);

    if (config.apiKey) {
      env[GEMINI_API_KEY] = config.apiKey;
    }
    if (config.baseUrl) {
      env[GOOGLE_GEMINI_BASE_URL] = config.baseUrl;
    }
    if (config.models) {
      const defaultModel = config.models.find(m => m.slot === 'default');
      if (defaultModel) {
        env[GEMINI_MODEL] = defaultModel.id;
      }
    }

    const lines = Object.entries(env).map(([k, v]) => `${k}=${v}`);
    await writeFile(envPath, lines.join('\n') + '\n', 'utf-8');
  },
};
