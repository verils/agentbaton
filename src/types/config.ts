/**
 * 统一配置文件结构
 *
 * 所有配置存储在 ~/.agentbaton/config.json 中
 */
export interface AgentbatonConfig {
  /** Provider API Key 存储：provider_name → api_key */
  providerKeys: Record<string, string>;
  /** Agent-Provider 启用状态：agent_name → { provider, modelAssignments } */
  enabledAgents: Record<string, EnabledAgent>;
}

/**
 * 单个 Agent 的启用状态
 */
export interface EnabledAgent {
  provider: string;
  modelAssignments: Record<string, string>;
}

/** @deprecated 使用 AgentbatonConfig['providerKeys'] 代替 */
export type ProviderKeys = AgentbatonConfig['providerKeys'];

/** @deprecated 使用 AgentbatonConfig['enabledAgents'] 代替 */
export type EnabledState = AgentbatonConfig['enabledAgents'];
