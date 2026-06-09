/**
 * Agent 定义接口
 */
export interface AgentDefinition {
  /** 唯一标识 */
  name: string;
  /** 显示名称 */
  displayName: string;
  /** 使用的 API 协议类型 */
  apiType: string;
  /** agent 原生配置文件位置 */
  configPath: string;
  /** 配置文件格式 */
  configFormat: 'json' | 'yaml' | 'toml';
  /** 模型槽位定义 */
  models: ModelSlot[];
}

/**
 * 模型槽位
 */
export interface ModelSlot {
  /** 槽位标识 */
  slot: string;
  /** 写入配置文件的字段名 */
  key: string;
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
