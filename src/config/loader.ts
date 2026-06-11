import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { paths } from './paths';
import type { Config } from '../types';

/** 默认空配置 */
const DEFAULT_CONFIG: Config = {
  providerKeys: {},
  enabledAgents: {},
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
export async function loadConfig(): Promise<Config> {
  // 优先读取新配置文件
  const config = await readJson<Config>(paths.config);
  if (config) {
    return { ...DEFAULT_CONFIG, ...config };
  }

  // 新配置不存在，尝试从旧 YAML 文件迁移
  const migrated = await migrateFromYaml();
  if (migrated) {
    await saveConfig(migrated);
    return migrated;
  }

  return { ...DEFAULT_CONFIG };
}

/**
 * 保存统一配置
 */
export async function saveConfig(config: Config): Promise<void> {
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
async function migrateFromYaml(): Promise<Config | null> {
  const batonDir = join(homedir(), '.agentbaton');
  const oldKeysPath = join(batonDir, 'state', 'provider-keys.yaml');
  const oldEnabledPath = join(batonDir, 'state', 'enabled.yaml');

  const hasOldKeys = existsSync(oldKeysPath);
  const hasOldEnabled = existsSync(oldEnabledPath);

  if (!hasOldKeys && !hasOldEnabled) {
    return null;
  }

  const config: Config = { ...DEFAULT_CONFIG };

  // 迁移 provider keys
  if (hasOldKeys) {
    const content = await readFile(oldKeysPath, 'utf-8');
    config.providerKeys = parseSimpleYaml(content);
  }

  // 迁移 enabled state（结构为 YAML 嵌套格式，简单解析）
  if (hasOldEnabled) {
    const content = await readFile(oldEnabledPath, 'utf-8');
    // enabled.yaml 结构较复杂，使用 JSON.parse 的 fallback
    // 如果是空文件或无效内容，跳过
    try {
      const state = JSON.parse(content);
      if (state && typeof state === 'object') {
        config.enabledAgents = state;
      }
    } catch {
      // YAML 嵌套格式无法简单解析，跳过
    }
  }

  // 清理旧文件和空目录
  try {
    if (hasOldKeys) await rm(oldKeysPath);
    if (hasOldEnabled) await rm(oldEnabledPath);

    const stateDir = join(batonDir, 'state');
    const agentsDir = join(batonDir, 'agents');
    const providersDir = join(batonDir, 'providers');

    for (const dir of [stateDir, agentsDir, providersDir]) {
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
