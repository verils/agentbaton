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
    expect(opencode.models).toHaveLength(1);
    expect(opencode.models[0].slot).toBe('default');
  });

  it('应包含各平台配置路径', () => {
    expect(opencode.home!.linux).toContain('opencode.json');
    expect(opencode.home!.macos).toContain('opencode.json');
    expect(opencode.home!.windows).toContain('opencode.json');
  });
});

describe('opencode parseConfig', () => {
  it('应解析完整的 opencode.json', async () => {
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
      },
    });

    const result = await opencode.loadNativeConfig();

    expect(result).not.toBeNull();
    expect(result!.apiKey).toBe('sk-deepseek');
    expect(result!.baseUrl).toBe('https://api.deepseek.com/v1');
    expect(result!.models).toEqual([{ slot: 'default', id: 'deepseek/deepseek-v4-flash' }]);
  });

  it('文件不存在时应返回空配置', async () => {
    mockedReadJson.mockResolvedValue(null);

    const result = await opencode.loadNativeConfig();

    expect(result).not.toBeNull();
    expect(result!.apiKey).toBeUndefined();
    expect(result!.baseUrl).toBeUndefined();
    expect(result!.models).toEqual([]);
  });

  it('仅配置 model 时应返回模型但无 apiKey/baseUrl', async () => {
    mockedReadJson.mockResolvedValue({
      model: 'anthropic/claude-sonnet-4',
    });

    const result = await opencode.loadNativeConfig();

    expect(result).not.toBeNull();
    expect(result!.apiKey).toBeUndefined();
    expect(result!.baseUrl).toBeUndefined();
    expect(result!.models).toEqual([{ slot: 'default', id: 'anthropic/claude-sonnet-4' }]);
  });

  it('应从 model 中正确解析 provider 名称并查找对应配置', async () => {
    mockedReadJson.mockResolvedValue({
      model: 'xiaomi-mimo/mimo-v2.5-pro',
      provider: {
        'xiaomi-mimo': {
          npm: '@ai-sdk/openai-compatible',
          options: {
            apiKey: 'sk-mimo',
            baseURL: 'https://token-plan-cn.xiaomimimo.com/v1',
          },
        },
      },
    });

    const result = await opencode.loadNativeConfig();

    expect(result!.apiKey).toBe('sk-mimo');
    expect(result!.baseUrl).toBe('https://token-plan-cn.xiaomimimo.com/v1');
    expect(result!.models).toEqual([{ slot: 'default', id: 'xiaomi-mimo/mimo-v2.5-pro' }]);
  });

  it('provider 无 options 时应返回 undefined', async () => {
    mockedReadJson.mockResolvedValue({
      model: 'zhipuai-coding-plan/glm-4.5-air',
      provider: {
        'zhipuai-coding-plan': {},
      },
    });

    const result = await opencode.loadNativeConfig();

    expect(result!.apiKey).toBeUndefined();
    expect(result!.baseUrl).toBeUndefined();
  });
});

describe('opencode saveConfig', () => {
  it('应正确写出 model 和 provider 的 apiKey/baseUrl', async () => {
    mockedReadJson.mockResolvedValue({
      model: 'deepseek/deepseek-v4-flash',
      provider: {
        deepseek: {
          options: { apiKey: 'old-key', baseURL: 'https://old.com/v1' },
        },
      },
    });

    await opencode.saveNativeConfig({
      apiKey: 'new-key',
      baseUrl: 'https://new.com/v1',
      models: [{ slot: 'default', id: 'deepseek/deepseek-v4-pro' }],
    });

    expect(mockedWriteJson).toHaveBeenCalledOnce();
    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    expect(saved.model).toBe('deepseek/deepseek-v4-pro');
    const provider = (saved.provider as Record<string, Record<string, unknown>>).deepseek;
    expect((provider.options as Record<string, unknown>).apiKey).toBe('new-key');
    expect((provider.options as Record<string, unknown>).baseURL).toBe('https://new.com/v1');
  });

  it('文件不存在时应创建新配置', async () => {
    mockedReadJson.mockResolvedValue(null);

    await opencode.saveNativeConfig({
      apiKey: 'sk-new',
      baseUrl: 'https://api.new.com/v1',
      models: [{ slot: 'default', id: 'deepseek/deepseek-v4-flash' }],
    });

    expect(mockedWriteJson).toHaveBeenCalledOnce();
    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    expect(saved.model).toBe('deepseek/deepseek-v4-flash');
    const provider = (saved.provider as Record<string, Record<string, unknown>>).deepseek;
    expect((provider.options as Record<string, unknown>).apiKey).toBe('sk-new');
    expect((provider.options as Record<string, unknown>).baseURL).toBe('https://api.new.com/v1');
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
        'xiaomi-mimo': {
          npm: '@ai-sdk/openai-compatible',
          options: { apiKey: 'sk-mimo', baseURL: 'https://mimo.com/v1' },
        },
      },
    });

    await opencode.saveNativeConfig({
      models: [{ slot: 'default', id: 'deepseek/deepseek-v4-pro' }],
    });

    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    expect(saved.$schema).toBe('https://opencode.ai/config.json');
    expect(saved.small_model).toBe('zhipuai-coding-plan/glm-4.5-air');
    const providers = saved.provider as Record<string, Record<string, unknown>>;
    expect(providers['xiaomi-mimo']).toBeDefined();
    expect((providers['xiaomi-mimo'].options as Record<string, unknown>).apiKey).toBe('sk-mimo');
  });

  it('不应覆盖未传入的字段', async () => {
    mockedReadJson.mockResolvedValue({
      model: 'deepseek/deepseek-v4-flash',
      provider: {
        deepseek: {
          options: { apiKey: 'existing-key', baseURL: 'https://existing.com/v1' },
        },
      },
    });

    await opencode.saveNativeConfig({
      models: [{ slot: 'default', id: 'deepseek/deepseek-v4-pro' }],
    });

    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    const provider = (saved.provider as Record<string, Record<string, unknown>>).deepseek;
    expect((provider.options as Record<string, unknown>).apiKey).toBe('existing-key');
    expect((provider.options as Record<string, unknown>).baseURL).toBe('https://existing.com/v1');
  });

  it('provider 不存在时应创建新 provider 配置', async () => {
    mockedReadJson.mockResolvedValue({
      model: 'volcengine-plan/glm-5.1',
    });

    await opencode.saveNativeConfig({
      apiKey: 'sk-new',
      baseUrl: 'https://api.volcengine.com/v1',
      models: [{ slot: 'default', id: 'volcengine-plan/glm-5.1' }],
    });

    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, unknown>;
    const provider = (saved.provider as Record<string, Record<string, unknown>>)['volcengine-plan'];
    expect(provider).toBeDefined();
    expect((provider.options as Record<string, unknown>).apiKey).toBe('sk-new');
    expect((provider.options as Record<string, unknown>).baseURL).toBe('https://api.volcengine.com/v1');
  });
});
