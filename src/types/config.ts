/**
 * Baton 自身配置
 */
export interface BatonConfig {
  /** 自定义 agent 定义目录 */
  agentsDir?: string;
  /** 自定义 provider 定义目录 */
  providersDir?: string;
  /** 状态文件目录 */
  stateDir?: string;
}

/**
 * Provider API Key 存储
 */
export interface ProviderKeys {
  /** provider_name → api_key */
  [providerName: string]: string;
}

/**
 * Agent-Provider 启用状态映射
 */
export interface EnabledState {
  /** agent_name → { provider_name, modelAssignments } */
  [agentName: string]: {
    provider: string;
    modelAssignments: Record<string, string>;
  };
}
