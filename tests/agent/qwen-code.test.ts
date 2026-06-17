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
    expect(qwenCode.multiProvider).toBe(true);
    expect(qwenCode.models).toHaveLength(1);
    expect(qwenCode.models[0].slot).toBe('default');
  });

  it('应包含各平台配置路径', () => {
    expect(qwenCode.home!.linux).toContain('.qwen');
    expect(qwenCode.home!.macos).toContain('.qwen');
    expect(qwenCode.home!.windows).toContain('.qwen');
  });
});

describe('qwen-code loadNativeConfig', () => {
  it('应解析完整的 settings.json 多供应商配置', async () => {
    mockedReadJson.mockResolvedValue({
      env: { CUSTOM_API_KEY: 'sk-test-key', MY_API_KEY: 'sk-other' },
      modelProviders: {
        openai: [
          {
            id: 'dashscope',
            name: '[ModelStudio Standard] qwen3.7-max',
            baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            envKey: 'CUSTOM_API_KEY',
          },
          {
            id: 'custom',
            name: 'Custom Provider',
            baseUrl: 'https://custom.api.com/v1',
            envKey: 'MY_API_KEY',
          },
        ],
      },
      model: { name: 'qwen3.7-max' },
    });

    const result = await qwenCode.loadNativeConfig();

    expect(result.models).toEqual([{ slot: 'default', id: 'qwen3.7-max' }]);
    expect(result.providers).toEqual({
      dashscope: { apiKey: 'sk-test-key', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
      custom: { apiKey: 'sk-other', baseUrl: 'https://custom.api.com/v1' },
    });
  });

  it('文件不存在时应返回空配置', async () => {
    mockedReadJson.mockResolvedValue(null);

    const result = await qwenCode.loadNativeConfig();

    expect(result.models).toEqual([]);
    expect(result.providers).toEqual({});
  });

  it('缺少部分字段时应正确处理', async () => {
    mockedReadJson.mockResolvedValue({
      env: {},
      model: {},
    });

    const result = await qwenCode.loadNativeConfig();

    expect(result.models).toEqual([]);
    expect(result.providers).toEqual({});
  });

  it('env 中无对应 key 时 apiKey 为 undefined', async () => {
    mockedReadJson.mockResolvedValue({
      env: {},
      modelProviders: {
        openai: [{
          id: 'dashscope',
          name: 'test',
          baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          envKey: 'MISSING_KEY',
        }],
      },
    });

    const result = await qwenCode.loadNativeConfig();

    expect(result.providers!['dashscope']).toEqual({
      apiKey: undefined,
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });
  });
});

describe('qwen-code saveNativeConfig', () => {
  it('文件不存在时不应抛出异常', async () => {
    mockedReadJson.mockResolvedValue(null);

    await expect(
      qwenCode.saveNativeConfig({
        providers: {
          custom: { apiKey: 'sk-new', baseUrl: 'https://new.api.com/v1' },
        },
      })
    ).resolves.not.toThrow();

    expect(mockedWriteJson).toHaveBeenCalledOnce();
    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    const env = saved.env as Record<string, string>;
    expect(env.CUSTOM_API_KEY_CUSTOM).toBe('sk-new');
  });

  it('应正确写出多供应商配置', async () => {
    mockedReadJson.mockResolvedValue({
      env: { OLD_KEY: 'old' },
      modelProviders: {
        openai: [{
          id: 'dashscope',
          name: 'test',
          baseUrl: 'https://old.url',
          envKey: 'OLD_KEY',
        }],
      },
    });

    await qwenCode.saveNativeConfig({
      providers: {
        dashscope: { apiKey: 'new-key', baseUrl: 'https://new.url' },
      },
    });

    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    const env = saved.env as Record<string, string>;
    expect(env.OLD_KEY).toBe('new-key');

    const providers = (saved.modelProviders as { openai: { id: string; baseUrl: string }[] }).openai;
    expect(providers[0].id).toBe('dashscope');
    expect(providers[0].baseUrl).toBe('https://new.url');
  });

  it('应正确写出 model name', async () => {
    mockedReadJson.mockResolvedValue({});

    await qwenCode.saveNativeConfig({
      models: [{ slot: 'default', id: 'qwen3.7-plus' }],
    });

    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    expect((saved.model as { name: string }).name).toBe('qwen3.7-plus');
  });

  it('应保留配置文件中的其它字段', async () => {
    mockedReadJson.mockResolvedValue({
      env: { CUSTOM_API_KEY: 'old-key' },
      $version: 4,
      memory: { enableAutoSkill: false },
    });

    await qwenCode.saveNativeConfig({
      providers: { custom: { apiKey: 'new-key' } },
    });

    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    expect(saved.$version).toBe(4);
    expect(saved.memory).toEqual({ enableAutoSkill: false });
  });

  it('provider 不存在时应创建新条目', async () => {
    mockedReadJson.mockResolvedValue({});

    await qwenCode.saveNativeConfig({
      providers: {
        newprovider: { apiKey: 'sk-new', baseUrl: 'https://new.api.com/v1' },
      },
    });

    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    const providers = (saved.modelProviders as { openai: { id: string; baseUrl: string; envKey: string }[] }).openai;
    expect(providers).toHaveLength(1);
    expect(providers[0].id).toBe('newprovider');
    expect(providers[0].baseUrl).toBe('https://new.api.com/v1');
    expect(providers[0].envKey).toBe('CUSTOM_API_KEY_NEWPROVIDER');
  });

  it('已存在 provider 应更新而非重复添加', async () => {
    mockedReadJson.mockResolvedValue({
      env: {},
      modelProviders: {
        openai: [{
          id: 'dashscope',
          name: 'DashScope',
          baseUrl: 'https://old.url',
          envKey: 'CUSTOM_API_KEY',
        }],
      },
    });

    await qwenCode.saveNativeConfig({
      providers: {
        dashscope: { baseUrl: 'https://new.url' },
      },
    });

    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    const providers = (saved.modelProviders as { openai: { id: string; baseUrl: string }[] }).openai;
    expect(providers).toHaveLength(1);
    expect(providers[0].id).toBe('dashscope');
    expect(providers[0].baseUrl).toBe('https://new.url');
  });

  it('未在 bindings 中的已有 provider 应被移除', async () => {
    mockedReadJson.mockResolvedValue({
      env: { KEY_A: 'sk-a', KEY_B: 'sk-b' },
      modelProviders: {
        openai: [
          { id: 'provider-a', name: 'A', baseUrl: 'https://a.com', envKey: 'KEY_A' },
          { id: 'provider-b', name: 'B', baseUrl: 'https://b.com', envKey: 'KEY_B' },
        ],
      },
    });

    await qwenCode.saveNativeConfig({
      providers: {
        'provider-a': { apiKey: 'sk-new-a' },
      },
    });

    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    const providers = (saved.modelProviders as { openai: { id: string }[] }).openai;
    expect(providers).toHaveLength(1);
    expect(providers[0].id).toBe('provider-a');
  });
});
