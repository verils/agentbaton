import { homedir } from 'node:os';
import { resolve } from 'node:path';

/**
 * 展开路径中的 ~ 为用户主目录
 */
export function expandHome(path: string): string {
  if (path.startsWith('~')) {
    return resolve(homedir(), path.slice(2));
  }
  return resolve(path);
}
