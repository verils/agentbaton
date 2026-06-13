import { describe, it, expect } from 'vitest';
import type { AgentDefinition } from '../../src/types';

export interface SyncAgentTestCase {
  agent: AgentDefinition;
  expectedId: string;
  expectedName: string;
  expectedCommand: string;
  expectedApiType: string;
}

export function defineSyncAgentTests(tc: SyncAgentTestCase) {
  describe(`${tc.expectedId} 定义`, () => {
    it('应包含正确的元数据', () => {
      expect(tc.agent.id).toBe(tc.expectedId);
      expect(tc.agent.name).toBe(tc.expectedName);
      expect(tc.agent.command).toBe(tc.expectedCommand);
      expect(tc.agent.apiType).toBe(tc.expectedApiType);
      expect(tc.agent.configFormat).toBe('json');
      expect(tc.agent.models).toHaveLength(1);
      expect(tc.agent.models[0].slot).toBe('default');
    });

    it('应包含各平台配置路径', () => {
      expect(tc.agent.configPaths.linux).toBeTruthy();
      expect(tc.agent.configPaths.macos).toBeTruthy();
      expect(tc.agent.configPaths.windows).toBeTruthy();
    });
  });

  describe(`${tc.expectedId} parseConfig`, () => {
    it('应解析完整配置', () => {
      const result = tc.agent.parseConfig!({
        model: 'test-model',
        baseUrl: 'https://api.example.com',
        apiKey: 'sk-test',
      });
      expect(result).toEqual({
        models: { default: 'test-model' },
        baseUrl: 'https://api.example.com',
        apiKey: 'sk-test',
      });
    });

    it('缺少 model 时应返回空字符串', () => {
      const result = tc.agent.parseConfig!({});
      expect(result).toEqual({
        models: { default: '' },
        baseUrl: undefined,
        apiKey: undefined,
      });
    });

    it('仅有 model 时应正确解析', () => {
      const result = tc.agent.parseConfig!({ model: 'some-model' });
      expect(result).not.toBeNull();
      expect(result!.models).toEqual({ default: 'some-model' });
      expect(result!.baseUrl).toBeUndefined();
      expect(result!.apiKey).toBeUndefined();
    });

    it('仅有 apiKey 时应正确解析', () => {
      const result = tc.agent.parseConfig!({ apiKey: 'sk-only' });
      expect(result).not.toBeNull();
      expect(result!.models).toEqual({ default: '' });
      expect(result!.apiKey).toBe('sk-only');
    });

    it('仅有 baseUrl 时应正确解析', () => {
      const result = tc.agent.parseConfig!({ baseUrl: 'https://proxy.example.com' });
      expect(result).not.toBeNull();
      expect(result!.models).toEqual({ default: '' });
      expect(result!.baseUrl).toBe('https://proxy.example.com');
    });
  });
}
