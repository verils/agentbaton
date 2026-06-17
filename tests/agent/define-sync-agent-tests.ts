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
      expect(tc.agent.models).toHaveLength(1);
      expect(tc.agent.models[0].slot).toBe('default');
    });

    it('应包含各平台配置路径', () => {
      expect(tc.agent.home!.linux).toBeTruthy();
      expect(tc.agent.home!.macos).toBeTruthy();
      expect(tc.agent.home!.windows).toBeTruthy();
    });
  });

  describe(`${tc.expectedId} parseConfig`, () => {
    it('stub 实现应返回 null', async () => {
      const result = await tc.agent.loadNativeConfig();
      expect(result).toBeNull();
    });
  });

  describe(`${tc.expectedId} saveConfig`, () => {
    it('stub 实现不应抛出异常', async () => {
      await expect(
        tc.agent.saveNativeConfig({ apiKey: 'test', baseUrl: 'https://example.com', models: [] })
      ).resolves.not.toThrow();
    });
  });
}
