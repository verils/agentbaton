import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/config', () => ({
  readJson: vi.fn(),
  writeJson: vi.fn(),
}));

const { readJson, writeJson } = await import('../../src/config');
const mockedReadJson = vi.mocked(readJson);
const mockedWriteJson = vi.mocked(writeJson);

const { opencode } = await import('../../src/agent/opencode');

beforeEach(() => {
  mockedReadJson.mockReset();
  mockedWriteJson.mockReset();
});

describe('opencode 定义', () => {
  it('应包含正确的元数据', () => {
    expect(opencode.id).toBe('opencode');
    expect(opencode.name).toBe('OpenCode');
    expect(opencode.command).toBe('opencode');
    expect(opencode.apiType).toBe('openai');
    expect(opencode.multiProvider).toBe(true);
    expect(opencode.models).toHaveLength(1);
    expect(opencode.models[0].slot).toBe('default');
  });

  it('应包含各平台配置路径', () => {
    expect(opencode.home!.linux).toContain('opencode.json');
    expect(opencode.home!.macos).toContain('opencode.json');
    expect(opencode.home!.windows).toContain('opencode.json');
  });
});

describe('opencode loadNativeConfig', () => {
  it('应解析完整的 opencode.json 多供应商配置', async () => {
    mockedReadJson.mockResolvedValue({
      model: 'deepseek/deepseek-v4-flash',
      provider: {
        deepseek: {
          npm: '@ai-sdk/openai-compatible',
          options: {
            apiKey: 'sk-deepseek',
            baseURL: 'https://api.deepseek.com/v1',
          },
        },
        'xiaomi-mimo': {
          npm: '@ai-sdk/openai-compatible',
          options: {
            apiKey: 'sk-mimo',
            baseURL: 'https://mimo.com/v1',
          },
        },
      },
    });

    const result = await opencode.loadNativeConfig();

    expect(result!.models).toEqual([{ slot: 'default', id: 'deepseek/deepseek-v4-flash' }]);
    expect(result!.providers).toEqual({
      deepseek: { apiKey: 'sk-deepseek', baseUrl: 'https://api.deepseek.com/v1' },
      'xiaomi-mimo': { apiKey: 'sk-mimo', baseUrl: 'https://mimo.com/v1' },
    });
  });

  it('文件不存在时应返回空配置', async () => {
    mockedReadJson.mockResolvedValue(null);

    const result = await opencode.loadNativeConfig();

    expect(result!.models).toEqual([]);
    expect(result!.providers).toEqual({});
  });

  it('仅配置 model 时应返回空 providers', async () => {
    mockedReadJson.mockResolvedValue({
      model: 'anthropic/claude-sonnet-4',
    });

    const result = await opencode.loadNativeConfig();

    expect(result!.models).toEqual([{ slot: 'default', id: 'anthropic/claude-sonnet-4' }]);
    expect(result!.providers).toEqual({});
  });

  it('provider 无 options 时应返回 undefined 值', async () => {
    mockedReadJson.mockResolvedValue({
      model: 'zhipuai-coding-plan/glm-4.5-air',
      provider: {
        'zhipuai-coding-plan': {},
      },
    });

    const result = await opencode.loadNativeConfig();

    expect(result!.providers!['zhipuai-coding-plan']).toEqual({
      apiKey: undefined,
      baseUrl: undefined,
    });
  });
});

describe('opencode saveNativeConfig', () => {
  it('应正确写出多供应商配置', async () => {
    mockedReadJson.mockResolvedValue({
      model: 'deepseek/deepseek-v4-flash',
      provider: {
        deepseek: {
          options: { apiKey: 'old-key', baseURL: 'https://old.com/v1' },
        },
      },
    });

    await opencode.saveNativeConfig({
      providers: {
        deepseek: { apiKey: 'new-key', baseUrl: 'https://new.com/v1' },
      },
    });

    expect(mockedWriteJson).toHaveBeenCalledOnce();
    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    const providers = saved.provider as Record<string, Record<string, unknown>>;
    expect((providers.deepseek.options as Record<string, unknown>).apiKey).toBe('new-key');
    expect((providers.deepseek.options as Record<string, unknown>).baseURL).toBe('https://new.com/v1');
  });

  it('应正确写出 model', async () => {
    mockedReadJson.mockResolvedValue({});

    await opencode.saveNativeConfig({
      models: [{ slot: 'default', id: 'deepseek/deepseek-v4-pro' }],
    });

    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    expect(saved.model).toBe('deepseek/deepseek-v4-pro');
  });

  it('文件不存在时应创建新配置', async () => {
    mockedReadJson.mockResolvedValue(null);

    await opencode.saveNativeConfig({
      models: [{ slot: 'default', id: 'deepseek/deepseek-v4-flash' }],
      providers: {
        deepseek: { apiKey: 'sk-new', baseUrl: 'https://api.new.com/v1' },
      },
    });

    expect(mockedWriteJson).toHaveBeenCalledOnce();
    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    expect(saved.model).toBe('deepseek/deepseek-v4-flash');
    const providers = saved.provider as Record<string, Record<string, unknown>>;
    expect((providers.deepseek.options as Record<string, unknown>).apiKey).toBe('sk-new');
    expect((providers.deepseek.options as Record<string, unknown>).baseURL).toBe('https://api.new.com/v1');
  });

  it('应保留配置文件中的其它字段', async () => {
    mockedReadJson.mockResolvedValue({
      $schema: 'https://opencode.ai/config.json',
      model: 'deepseek/deepseek-v4-flash',
      small_model: 'zhipuai-coding-plan/glm-4.5-air',
      provider: {
        deepseek: {
          npm: '@ai-sdk/openai-compatible',
          options: { apiKey: 'old-key', baseURL: 'https://old.com/v1' },
        },
      },
    });

    await opencode.saveNativeConfig({
      providers: {
        deepseek: { apiKey: 'new-key' },
      },
    });

    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    expect(saved.$schema).toBe('https://opencode.ai/config.json');
    expect(saved.small_model).toBe('zhipuai-coding-plan/glm-4.5-air');
  });

  it('不应覆盖未传入的供应商', async () => {
    mockedReadJson.mockResolvedValue({
      model: 'deepseek/deepseek-v4-flash',
      provider: {
        deepseek: {
          options: { apiKey: 'sk-deepseek', baseURL: 'https://deepseek.com/v1' },
        },
        'xiaomi-mimo': {
          options: { apiKey: 'sk-mimo', baseURL: 'https://mimo.com/v1' },
        },
      },
    });

    await opencode.saveNativeConfig({
      providers: {
        deepseek: { apiKey: 'new-key' },
      },
    });

    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    const providers = saved.provider as Record<string, Record<string, unknown>>;
    expect((providers.deepseek.options as Record<string, unknown>).apiKey).toBe('new-key');
    expect((providers['xiaomi-mimo'].options as Record<string, unknown>).apiKey).toBe('sk-mimo');
  });

  it('provider 不存在时应创建新 provider 配置', async () => {
    mockedReadJson.mockResolvedValue({});

    await opencode.saveNativeConfig({
      providers: {
        'volcengine-plan': { apiKey: 'sk-volc', baseUrl: 'https://api.volcengine.com/v1' },
      },
    });

    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    const providers = saved.provider as Record<string, Record<string, unknown>>;
    expect(providers['volcengine-plan']).toBeDefined();
    expect((providers['volcengine-plan'].options as Record<string, unknown>).apiKey).toBe('sk-volc');
    expect((providers['volcengine-plan'].options as Record<string, unknown>).baseURL).toBe('https://api.volcengine.com/v1');
  });
});
