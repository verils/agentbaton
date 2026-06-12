import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { paths } from './paths';
import type { AgentBatonConfig } from '../types';

/** 默认空配置 */
const DEFAULT_CONFIG: AgentBatonConfig = {
  agents: {},
  providers: [],
};

/**
 * 确保目录存在
 */
async function ensureDir(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

/**
 * 读取 JSON 文件
 */
export async function readJson<T>(filePath: string): Promise<T | null> {
  if (!existsSync(filePath)) {
    return null;
  }
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

/**
 * 写入 JSON 文件
 */
export async function writeJson(filePath: string, data: unknown): Promise<void> {
  await ensureDir(dirname(filePath));
  const content = JSON.stringify(data, null, 2);
  await writeFile(filePath, content, 'utf-8');
}

/**
 * 加载统一配置（含从旧 YAML 文件的迁移逻辑）
 */
export async function loadConfig(): Promise<AgentBatonConfig> {
  // 优先读取新配置文件
  const config = await readJson<AgentBatonConfig>(paths.config);
  if (config) {
    return { ...DEFAULT_CONFIG, ...config };
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * 保存统一配置
 */
export async function saveConfig(config: AgentBatonConfig): Promise<void> {
  await writeJson(paths.config, config);
}

/**
 * 解析简单的 YAML key: value 格式（仅支持扁平键值对）
 */
function parseSimpleYaml(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;
    const key = trimmed.slice(0, colonIndex).trim();
    let value = trimmed.slice(colonIndex + 1).trim();
    // 去除引号
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

/**
 * 从旧 YAML 文件迁移配置
 */
async function migrateFromYaml(): Promise<AgentBatonConfig | null> {
  const batonDir = join(homedir(), '.agentbaton');
  const oldKeysPath = join(batonDir, 'state', 'provider-keys.yaml');
  const oldEnabledPath = join(batonDir, 'state', 'enabled.yaml');

  const hasOldKeys = existsSync(oldKeysPath);
  const hasOldEnabled = existsSync(oldEnabledPath);

  if (!hasOldKeys && !hasOldEnabled) {
    return null;
  }

  const config: AgentBatonConfig = { ...DEFAULT_CONFIG };

  // 清理旧文件和空目录
  try {
    if (hasOldKeys) await rm(oldKeysPath);
    if (hasOldEnabled) await rm(oldEnabledPath);

    const stateDir = join(batonDir, 'state');
    const agentsDir = join(batonDir, 'agents');
    const providersDir = join(batonDir, 'providers');

    for (const dir of [ stateDir, agentsDir, providersDir ]) {
      try {
        await rm(dir, { recursive: false });
      } catch {
        // 目录非空或不存在，忽略
      }
    }
  } catch {
    // 清理失败不影响迁移
  }

  return config;
}
