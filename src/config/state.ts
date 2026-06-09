import type { ProviderKeys, EnabledState } from '../types/config.js';
import { paths } from './paths.js';
import { readYaml, writeYaml } from './loader.js';

/**
 * 读取 Provider API Keys
 */
export async function getProviderKeys(): Promise<ProviderKeys> {
  return (await readYaml<ProviderKeys>(paths.providerKeys)) ?? {};
}

/**
 * 保存 Provider API Key
 */
export async function setProviderKey(providerName: string, apiKey: string): Promise<void> {
  const keys = await getProviderKeys();
  keys[providerName] = apiKey;
  await writeYaml(paths.providerKeys, keys);
}

/**
 * 读取启用状态
 */
export async function getEnabledState(): Promise<EnabledState> {
  return (await readYaml<EnabledState>(paths.enabled)) ?? {};
}

/**
 * 保存启用状态
 */
export async function setEnabledState(state: EnabledState): Promise<void> {
  await writeYaml(paths.enabled, state);
}
