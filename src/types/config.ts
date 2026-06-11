import { ApiType } from "./provider";

/**
 * 统一配置文件结构
 *
 * 所有配置存储在 ~/.agentbaton/config.json 中
 */
export interface Config {
  /** 已设置的智能体 */
  agents: Record<string, Agent>;
  /** 已添加的模型供应商 */
  providers: Provider[];

  /** @deprecated Agent-Provider 启用状态：agent_name → { provider, modelAssignments } */
  enabledAgents: Record<string, EnabledAgent>;
}

interface Agent {
  id: string;
  name: string;
}

export interface Provider {
  /** UUID，避免冲突 */
  id: string;
  /** 模型供应商名称 */
  name: string;
  /** API Key */
  apiKey: string;
  /** API 接入端点 */
  endpoints: Endpoint[];
  /** 模型列表 */
  models: Model[];
}

interface Endpoint {
  type: ApiType;
  baseUrl: string;
}

interface Model {
  /** 模型 ID */
  id: string;
  /** 模型显示名称 */
  name: string;
  /** 模型上下文大小 */
  contextWindowSize: number;
}

/**
 * 单个 Agent 的启用状态
 */
export interface EnabledAgent {
  provider: string;
  modelAssignments: Record<string, string>;
}

/** @deprecated 使用 AgentbatonConfig['enabledAgents'] 代替 */
export type EnabledState = Config['enabledAgents'];
