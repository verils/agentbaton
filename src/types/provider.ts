export type ApiType = 'openai' | 'anthropic' | 'google';

/**
 * Provider 定义接口
 */
export interface ProviderPreset {
  /** 唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** API 端点 */
  endpoints?: Record<string, ProviderEndpoint>,

  /** 获取可用模型列表 */
  fetchModels?(): Promise<ProviderModel[]>

  /** @deprecated 提供的 API 协议类型 */
  apiType?: ApiType;
  /** @deprecated API 基础地址 */
  baseUrl?: string;

  /** 可用模型列表 */
  models: ProviderModel[];
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
  /** 模型名称 */
  id?: string;
  /** 模型名称 */
  name: string;
  /** 模型描述 */
  description?: string;
  /** 上下文窗口大小 */
  contextWindowSize?: number;
}
