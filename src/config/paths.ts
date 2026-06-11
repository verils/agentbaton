import { homedir } from 'node:os';
import { join } from 'node:path';

const BATON_DIR = join(homedir(), '.agentbaton');

export const paths = {
  /** Baton 根目录 */
  root: BATON_DIR,
  /** 统一配置文件 */
  config: join(BATON_DIR, 'config.json'),
};
