import { homedir } from 'node:os';
import { join } from 'node:path';

const BATON_DIR = join(homedir(), '.agentbaton');

export const paths = {
  /** Baton 根目录 */
  root: BATON_DIR,
  /** 自身配置文件 */
  config: join(BATON_DIR, 'config.yaml'),
  /** 用户自定义 provider 定义目录 */
  providers: join(BATON_DIR, 'providers'),
  /** 用户自定义 agent 定义目录 */
  agents: join(BATON_DIR, 'agents'),
  /** 状态文件目录 */
  state: join(BATON_DIR, 'state'),
  /** Provider API Key 存储文件 */
  providerKeys: join(BATON_DIR, 'state', 'provider-keys.yaml'),
  /** Agent-Provider 启用状态映射文件 */
  enabled: join(BATON_DIR, 'state', 'enabled.yaml'),
};
