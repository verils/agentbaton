import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/config', () => ({
  readJson: vi.fn(),
  writeJson: vi.fn(),
}));

const { readJson, writeJson } = await import('../../src/config');
const mockedReadJson = vi.mocked(readJson);
const mockedWriteJson = vi.mocked(writeJson);

const { qwenCode } = await import('../../src/agent/qwen-code');

beforeEach(() => {
  mockedReadJson.mockReset();
  mockedWriteJson.mockReset();
});

describe('qwen-code 定义', () => {
  it('应包含正确的元数据', () => {
    expect(qwenCode.id).toBe('qwen-code');
    expect(qwenCode.name).toBe('Qwen Code');
    expect(qwenCode.command).toBe('qwen');
    expect(qwenCode.apiType).toBe('openai');
    expect(qwenCode.models).toHaveLength(1);
    expect(qwenCode.models[0].slot).toBe('default');
  });

  it('应包含各平台配置路径', () => {
    expect(qwenCode.home!.linux).toContain('.qwen');
    expect(qwenCode.home!.macos).toContain('.qwen');
    expect(qwenCode.home!.windows).toContain('.qwen');
  });
});

describe('qwen-code loadConfig', () => {
  it('应解析完整的 settings.json', async () => {
    mockedReadJson.mockResolvedValue({
      env: { CUSTOM_API_KEY: 'sk-test-key' },
      modelProviders: {
        openai: [{
          id: 'qwen3.7-max',
          name: '[ModelStudio Standard] qwen3.7-max',
          baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          envKey: 'CUSTOM_API_KEY',
        }],
      },
      model: { name: 'qwen3.7-max' },
    });

    const result = await qwenCode.loadConfig();
    expect(result).not.toBeNull();
    expect(result!.apiKey).toBe('sk-test-key');
    expect(result!.baseUrl).toBe('https://dashscope.aliyuncs.com/compatible-mode/v1');
    expect(result!.models).toEqual([{ slot: 'default', id: 'qwen3.7-max' }]);
  });

  it('文件不存在时应返回 null', async () => {
    mockedReadJson.mockResolvedValue(null);

    const result = await qwenCode.loadConfig();
    expect(result).toBeNull();
  });

  it('缺少部分字段时应正确处理', async () => {
    mockedReadJson.mockResolvedValue({
      env: {},
      model: {},
    });

    const result = await qwenCode.loadConfig();
    expect(result).not.toBeNull();
    expect(result!.apiKey).toBeUndefined();
    expect(result!.baseUrl).toBeUndefined();
    expect(result!.models).toEqual([]);
  });

  it('仅有 apiKey 时应正确解析', async () => {
    mockedReadJson.mockResolvedValue({
      env: { CUSTOM_API_KEY: 'sk-only' },
    });

    const result = await qwenCode.loadConfig();
    expect(result).not.toBeNull();
    expect(result!.apiKey).toBe('sk-only');
    expect(result!.baseUrl).toBeUndefined();
    expect(result!.models).toEqual([]);
  });
});

describe('qwen-code saveConfig', () => {
  it('文件不存在时不应抛出异常', async () => {
    mockedReadJson.mockResolvedValue(null);

    await expect(
      qwenCode.saveConfig({ apiKey: 'sk-new', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' })
    ).resolves.not.toThrow();

    expect(mockedWriteJson).toHaveBeenCalledOnce();
    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    const env = saved.env as Record<string, string>;
    expect(env.CUSTOM_API_KEY).toBe('sk-new');
  });

  it('应正确写出 apiKey 和 baseUrl', async () => {
    mockedReadJson.mockResolvedValue({
      env: { CUSTOM_API_KEY: 'old-key' },
      modelProviders: {
        openai: [{
          id: 'qwen3.7-max',
          name: 'test',
          baseUrl: 'https://old.url',
          envKey: 'CUSTOM_API_KEY',
        }],
      },
    });

    await qwenCode.saveConfig({
      apiKey: 'new-key',
      baseUrl: 'https://new.url',
    });

    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    const env = saved.env as Record<string, string>;
    expect(env.CUSTOM_API_KEY).toBe('new-key');

    const providers = (saved.modelProviders as { openai: { baseUrl: string }[] }).openai;
    expect(providers[0].baseUrl).toBe('https://new.url');
  });

  it('应正确写出 model name', async () => {
    mockedReadJson.mockResolvedValue({ env: {} });

    await qwenCode.saveConfig({
      models: [{ slot: 'default', id: 'qwen3.7-plus' }],
    });

    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    expect((saved.model as { name: string }).name).toBe('qwen3.7-plus');
  });

  it('应保留配置文件中的其它无关字段', async () => {
    mockedReadJson.mockResolvedValue({
      env: { CUSTOM_API_KEY: 'old-key' },
      $version: 4,
      memory: { enableAutoSkill: false },
    });

    await qwenCode.saveConfig({ apiKey: 'new-key' });

    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    expect(saved.$version).toBe(4);
    expect(saved.memory).toEqual({ enableAutoSkill: false });
  });

  it('应保留已有但未传入的字段', async () => {
    mockedReadJson.mockResolvedValue({
      env: { CUSTOM_API_KEY: 'existing-key', OTHER_KEY: 'other' },
      modelProviders: {
        openai: [{
          id: 'qwen3.7-max',
          name: 'test',
          baseUrl: 'https://existing.url',
          envKey: 'CUSTOM_API_KEY',
        }],
      },
      model: { name: 'qwen3.7-max' },
    });

    await qwenCode.saveConfig({
      models: [{ slot: 'default', id: 'qwen3.7-plus' }],
    });

    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    const env = saved.env as Record<string, string>;
    expect(env.CUSTOM_API_KEY).toBe('existing-key');
    expect(env.OTHER_KEY).toBe('other');
    expect((saved.model as { name: string }).name).toBe('qwen3.7-plus');
  });

  it('providers 列表为空时应创建新条目', async () => {
    mockedReadJson.mockResolvedValue({
      env: {},
      modelProviders: { openai: [] },
    });

    await qwenCode.saveConfig({ baseUrl: 'https://new.url' });

    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    const providers = (saved.modelProviders as { openai: { baseUrl: string }[] }).openai;
    expect(providers).toHaveLength(1);
    expect(providers[0].baseUrl).toBe('https://new.url');
  });
});
