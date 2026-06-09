import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { paths } from './paths.js';

/**
 * 确保目录存在
 */
async function ensureDir(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

/**
 * 读取 YAML 文件
 */
export async function readYaml<T>(filePath: string): Promise<T | null> {
  if (!existsSync(filePath)) {
    return null;
  }
  const content = await readFile(filePath, 'utf-8');
  return parseYaml(content) as T;
}

/**
 * 写入 YAML 文件
 */
export async function writeYaml(filePath: string, data: unknown): Promise<void> {
  await ensureDir(dirname(filePath));
  const content = stringifyYaml(data);
  await writeFile(filePath, content, 'utf-8');
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
 * 初始化 Baton 目录结构
 */
export async function initBatonDirs(): Promise<void> {
  await ensureDir(paths.root);
  await ensureDir(paths.providers);
  await ensureDir(paths.agents);
  await ensureDir(paths.state);
}
