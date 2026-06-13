import { ApiType, Model } from "./model";

/**
 * 统一配置文件结构
 *
 * 所有配置存储在 ~/.agentbaton/config.json 中
 */
export interface AgentBatonConfig {
  /** 已设置的智能体 */
  agents: Record<string, Agent>;
  /** 已添加的模型供应商 */
  providers: Provider[];
}

export interface Agent {
  id: string;
  currentProvider: string;
  modelAssignments: Record<string, string>;
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
