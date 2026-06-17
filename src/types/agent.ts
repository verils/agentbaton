import { ApiType } from "./model";

/**
 * 平台类型
 */
export type Platform = 'linux' | 'windows' | 'macos';

/**
 * Agent 定义接口
 */
export interface AgentDefinition {
  /** 智能体 ID */
  id: string;
  /** 智能体名称 */
  name: string;
  /** 可执行命令 */
  command: string;
  /** 使用的 API 协议类型 */
  apiType: ApiType;
  /** 各平台的配置文件目录 */
  home?: AgentNativePaths;
  /** 模型定义 */
  models: AgentModelSlot[];
  /** 多供应商模式：agentbaton 管理 provider 绑定而非模型槽位 */
  multiProvider?: boolean;

  /** 从智能体配置文件内容中解析出配置 */
  loadNativeConfig(): Promise<AgentNativeConfig | null>;

  /** 保存配置到智能体配置文件 */
  saveNativeConfig(config: AgentNativeConfig): Promise<void>;
}

/**
 * 平台配置路径映射
 */
export type AgentNativePaths = {
  [key in Platform]: string;
};

/**
 * 模型槽位
 */
export interface AgentModelSlot {
  /** 槽位标识 */
  slot: string;
  /** 槽位名称 */
  name: string;
  /** 描述 */
  description?: string;
}

export interface AgentModel {
  /** 槽位标识 */
  slot: string;
  /** 已设置的模型 ID */
  id: string;
}

/**
 * 供应商绑定（可选覆盖值，缺省字段从 agentbaton provider 继承）
 */
export interface AgentProviderBinding {
  apiKey?: string;
  baseUrl?: string;
}

/**
 * 从智能体原生配置文件解析出的配置摘要
 */
export interface AgentNativeConfig {
  /** API 接入端点 */
  baseUrl?: string;
  /** API 密钥（原值） */
  apiKey?: string;
  /** 各槽位的模型值：slot → model value */
  models?: AgentModel[];
  /** 多供应商模式下的供应商绑定：providerId → binding */
  providers?: Record<string, AgentProviderBinding>;
}
