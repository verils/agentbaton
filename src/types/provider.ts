import { ApiType } from "./model";

/**
 * Provider 定义接口
 */
export interface ProviderPreset {
  /** 唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;

  /** 定价方案，每个方案包含不同的 API 端点 */
  pricing?: ProviderPricing[];

  /** 获取可用模型列表 */
  fetchModels?(apiType: ApiType, baseUrl: string, apiKey: string): Promise<ProviderModel[]>

  /** 可用模型列表 */
  models?: ProviderModel[];
}

export interface ProviderPricing {
  /** 付费模式 ID */
  id: string;
  /** 付费模式名称 */
  name: string;
  /** API 端点 */
  endpoints: Record<string, ProviderEndpoint>;
}

interface ProviderEndpoint {
  /** 提供的 API 协议类型 */
  apiType: ApiType;
  /** API 基础地址 */
  baseUrl: string;
}

/**
 * Provider 模型
 */
export interface ProviderModel {
  /** API 模型 ID */
  id: string;
  /** 显示名称 */
  name: string;
  /** 上下文窗口大小 */
  contextWindowSize?: number;
}

