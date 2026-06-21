import type { AgentDefinition, AgentNativeConfig, AgentModel } from '../types';
import { resolvePlatformHome } from '../utils';
import { readJson, writeJson } from '../config';

interface PiAuthProvider {
  type?: string;
  key?: string;
  [key: string]: unknown;
}

interface PiAuthConfig {
  [provider: string]: PiAuthProvider;
}

interface PiSettingsConfig {
  lastChangelogVersion?: string;
  theme?: string;
  defaultProvider?: string;
  defaultModel?: string;
  defaultThinkingLevel?: string;
  [key: string]: unknown;
}

export const pi: AgentDefinition = {
  id: 'pi',
  name: 'Pi',
  command: 'pi',
  apiType: 'openai',
  multiProvider: false,
  home: {
    linux: '~/.pi/agent',
    macos: '~/.pi/agent',
    windows: '~/.pi/agent',
  },
  models: [
    {
      slot: 'default',
      name: 'model',
      description: '默认模型',
    },
  ],
  async loadNativeConfig(): Promise<AgentNativeConfig | null> {
    const configDir = resolvePlatformHome(this.home!);
    const auth = await readJson<PiAuthConfig>(`${configDir}/auth.json`);
    const settings = await readJson<PiSettingsConfig>(`${configDir}/settings.json`);

    const providerName = settings?.defaultProvider;
    const providerAuth = providerName ? auth?.[providerName] : undefined;

    const models: AgentModel[] = [];
    if (settings?.defaultModel) {
      models.push({ slot: 'default', id: settings.defaultModel });
    }

    return {
      apiKey: providerAuth?.key,
      models,
    };
  },
  async saveNativeConfig(config: AgentNativeConfig): Promise<void> {
    const configDir = resolvePlatformHome(this.home!);
    const authPath = `${configDir}/auth.json`;
    const settingsPath = `${configDir}/settings.json`;

    const settings = await readJson<PiSettingsConfig>(settingsPath) ?? {} as PiSettingsConfig;
    const providerName = settings.defaultProvider ?? 'default';

    if (config.apiKey) {
      const auth = await readJson<PiAuthConfig>(authPath) ?? {} as PiAuthConfig;
      if (!auth[providerName]) {
        auth[providerName] = {};
      }
      auth[providerName].key = config.apiKey;
      auth[providerName].type = 'api_key';
      await writeJson(authPath, auth);
    }

    if (config.models) {
      const defaultModel = config.models.find(m => m.slot === 'default');
      if (defaultModel) {
        settings.defaultModel = defaultModel.id;
      }
    }

    await writeJson(settingsPath, settings);
  },
};
