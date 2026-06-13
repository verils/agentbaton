import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { parse as parseToml, stringify as stringifyToml } from 'smol-toml';
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
 * 读取 TOML 文件
 */
export async function readToml<T>(filePath: string): Promise<T | null> {
  if (!existsSync(filePath)) {
    return null;
  }
  const content = await readFile(filePath, 'utf-8');
  return parseToml(content) as unknown as T;
}

/**
 * 写入 TOML 文件
 */
export async function writeToml(filePath: string, data: Record<string, unknown>): Promise<void> {
  await ensureDir(dirname(filePath));
  const content = stringifyToml(data);
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
