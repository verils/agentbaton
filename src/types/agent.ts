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
  home?: AgentConfigPaths;
  /** 模型定义 */
  models: AgentModelSlot[];

  /** 从智能体配置文件内容中解析出配置 */
  parseConfig(unused?: Record<string, unknown>): Promise<AgentConfig | null>;

  /** 保存配置到智能体配置文件 */
  saveConfig(config: AgentConfig): Promise<void>;
}

/**
 * 平台配置路径映射
 */
export type AgentConfigPaths = {
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
 * 从智能体配置文件解析出的配置摘要
 */
export interface AgentConfig {
  /** API 接入端点 */
  baseUrl?: string;
  /** API 密钥（原值） */
  apiKey?: string;
  /** 各槽位的模型值：slot → model value */
  models?: AgentModel[];
}
