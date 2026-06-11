import { ApiType } from "./provider";

/**
 * 从智能体配置文件解析出的配置摘要
 */
export interface AgentConfigSummary {
  /** API 接入端点 */
  baseUrl?: string;
  /** API 密钥（原值） */
  apiKey?: string;
  /** 各槽位的模型值：slot → model value */
  models: Record<string, string>;
}

/**
 * Agent 定义接口
 */
export interface AgentDefinition {
  /** 唯一标识 */
  name: string;
  /** 显示名称 */
  displayName: string;
  /** 可执行命令 */
  command: string;
  /** 使用的 API 协议类型 */
  apiType: ApiType;
  /** 各平台的配置文件路径 */
  configPath: PlatformConfigPath;
  /** 配置文件格式 */
  configFormat: 'json' | 'yaml' | 'toml' | string;
  /** 模型定义 */
  models: ModelSlot[];

  /** 从配置文件内容中解析出配置摘要 */
  parseConfig(config: Record<string, unknown>): AgentConfigSummary;

  /** 配置智能体的逻辑 */
  config?(): Promise<void>;
}

/**
 * 平台类型
 */
export type Platform = 'linux' | 'windows' | 'macos';

/**
 * 平台配置路径映射
 */
export type PlatformConfigPath = {
  [key in Platform]: string;
};

/**
 * 模型槽位
 */
export interface ModelSlot {
  /** 槽位标识 */
  slot: string;
  /** 写入配置文件的字段名 */
  name: string;
  /** 描述 */
  description: string;
}

/**
 * Agent 运行时状态
 */
export interface AgentState {
  /** 已启用的 provider 名称 */
  enabledProvider?: string;
  /** 模型分配映射：slot → provider_model */
  modelAssignments?: Record<string, string>;
}
