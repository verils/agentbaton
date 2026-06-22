import { ApiType, Model } from "./model.js";
import { AgentProviderBinding } from "./agent.js";

/**
 * 统一配置文件结构
 *
 * 所有配置存储在 ~/.agentbaton/config/index.json 中
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
  modelSlots: Record<string, string>;
  history?: Record<string, Record<string, string>>;
  /** 多供应商模式下的供应商绑定：providerId → binding */
  providers?: Record<string, AgentProviderBinding>;
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
