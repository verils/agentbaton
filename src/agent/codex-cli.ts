import type { AgentNativeConfig, AgentDefinition, AgentModel } from '../types/index.js';
import { resolvePlatformHome } from "../utils/index.js";
import { readJson, readToml, writeJson, writeToml } from "../config/index.js";

interface CodexAuthConfig {
  OPENAI_API_KEY: string;
}

interface CodexProviderConfig {
  name: string;
  base_url: string;
  requires_openai_auth?: boolean;
}

interface CodexConfig {
  model_provider: string;
  model: string;
  model_reasoning_effort?: string;
  disable_response_storage?: boolean;
  model_providers: Record<string, CodexProviderConfig>;
  [key: string]: unknown;
}

export const codexCli: AgentDefinition = {
  id: 'codex-cli',
  name: 'Codex CLI',
  command: 'codex',
  apiType: 'openai',
  home: {
    linux: '~/.codex',
    macos: '~/.codex',
    windows: '~/.codex',
  },
  models: [
    {
      slot: 'default',
      name: 'Default',
    },
  ],
  async loadNativeConfig(): Promise<AgentNativeConfig | null> {
    const configDir = resolvePlatformHome(this.home!);
    const codexAuth = await readJson<CodexAuthConfig>(`${configDir}/auth.json`);
    const codexConfig = await readToml<CodexConfig>(`${configDir}/config.toml`);

    const providerName = codexConfig?.model_provider;
    const provider = providerName ? codexConfig.model_providers?.[providerName] : undefined;

    const models: AgentModel[] = [];
    if (codexConfig?.model) {
      models.push({ slot: 'default', id: codexConfig.model });
    }

    return {
      baseUrl: provider?.base_url,
      apiKey: codexAuth?.OPENAI_API_KEY,
      models,
    };
  },
  async saveNativeConfig(config: AgentNativeConfig) {
    const configDir = resolvePlatformHome(this.home!);

    if (config.apiKey) {
      const authPath = `${configDir}/auth.json`;
      const codexAuth = await readJson<CodexAuthConfig>(authPath) ?? {} as CodexAuthConfig;
      codexAuth.OPENAI_API_KEY = config.apiKey;
      await writeJson(authPath, codexAuth);
    }

    const tomlPath = `${configDir}/config.toml`;
    const codexConfig = await readToml<CodexConfig>(tomlPath) ?? {} as CodexConfig;

    if (config.models) {
      const defaultModel = config.models.find(m => m.slot === 'default');
      if (defaultModel) {
        codexConfig.model = defaultModel.id;
      }
    }

    if (config.baseUrl) {
      const providerName = codexConfig.model_provider || 'agentbaton';
      codexConfig.model_provider = providerName;
      if (!codexConfig.model_providers) {
        codexConfig.model_providers = {};
      }
      const provider = codexConfig.model_providers[providerName] ?? { name: 'Custom' };
      provider.base_url = config.baseUrl;
      provider.requires_openai_auth = true;
      codexConfig.model_providers[providerName] = provider;
    }

    await writeToml(tomlPath, codexConfig as Record<string, unknown>);
  }
};
