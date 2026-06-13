/** API 类型 */
export type ApiType = 'openai' | 'anthropic' | 'google';

/** 模型信息 */
export interface Model {
  /** 模型 ID */
  id: string;
  /** 模型显示名称 */
  name: string;
  /** 模型上下文大小 */
  contextWindowSize?: number;
}
