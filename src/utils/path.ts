import { homedir } from 'node:os';
import { resolve } from 'node:path';
import type { Platform } from '../types';

/**
 * 获取当前平台
 */
export function getCurrentPlatform(): Platform {
  const platform = process.platform;
  switch (platform) {
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'macos';
    default:
      return 'linux';
  }
}

/**
 * 展开路径中的 ~ 为用户主目录
 */
export function expandHome(path: string): string {
  if (path.startsWith('~')) {
    return resolve(homedir(), path.slice(2));
  }
  return resolve(path);
}

/**
 * 获取当前平台的配置路径并展开 ~
 */
export function resolvePlatformHome(paths: Record<Platform, string>): string {
  const platform = getCurrentPlatform();
  const agentHome = paths[platform];
  return expandHome(agentHome);
}

/**
 * 检查命令是否可执行
 */
export async function isCommandAvailable(command: string): Promise<boolean> {
  const { execSync } = await import('node:child_process');
  try {
    const checkCmd = process.platform === 'win32'
      ? `where ${command}`
      : `which ${command}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
