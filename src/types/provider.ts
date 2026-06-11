/**
 * Provider 定义接口
 */
export interface ProviderDefinition {
  /** 唯一标识 */
  name: string;
  /** 显示名称 */
  displayName: string;
  /** 提供的 API 协议类型 */
  apiType?: string;
  /** API 基础地址 */
  baseUrl?: string;
  /** API 端点 */
  endpoints?: Record<string, ProviderEndpoint>,
  /** 可用模型列表 */
  models: ProviderModel[];
}

interface ProviderEndpoint {
  /** 提供的 API 协议类型 */
  apiType: string;
  /** API 基础地址 */
  baseUrl: string;
}


/**
 * Provider 模型
 */
export interface ProviderModel {
  /** 模型名称 */
  name: string;
  /** 模型描述 */
  description: string;
}
