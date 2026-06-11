import type { ProviderKeys, EnabledState } from '../types';
import { loadConfig, saveConfig } from './loader';

/**
 * 读取 Provider API Keys
 */
export async function getProviderKeys(): Promise<ProviderKeys> {
  const config = await loadConfig();
  return config.providerKeys;
}

/**
 * 保存 Provider API Key
 */
export async function setProviderKey(providerName: string, apiKey: string): Promise<void> {
  const config = await loadConfig();
  config.providerKeys[providerName] = apiKey;
  await saveConfig(config);
}

/**
 * 删除 Provider API Key
 */
export async function deleteProviderKey(providerName: string): Promise<void> {
  const config = await loadConfig();
  delete config.providerKeys[providerName];
  await saveConfig(config);
}

/**
 * 读取启用状态
 */
export async function getEnabledState(): Promise<EnabledState> {
  const config = await loadConfig();
  return config.enabledAgents;
}

/**
 * 保存启用状态
 */
export async function setEnabledState(state: EnabledState): Promise<void> {
  const config = await loadConfig();
  config.enabledAgents = state;
  await saveConfig(config);
}
