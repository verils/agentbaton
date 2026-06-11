import type { EnabledState } from '../types';
import { loadConfig, saveConfig } from './loader';

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
