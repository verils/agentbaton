import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/config', () => ({
  readJson: vi.fn(),
  readToml: vi.fn(),
  writeJson: vi.fn(),
  writeToml: vi.fn(),
}));

const { readJson, readToml, writeJson, writeToml } = await import('../../src/config');
const mockedReadJson = vi.mocked(readJson);
const mockedReadToml = vi.mocked(readToml);
const mockedWriteJson = vi.mocked(writeJson);
const mockedWriteToml = vi.mocked(writeToml);

const { codexCli } = await import('../../src/agent/codex-cli');

const SAMPLE_TOML = {
  model_provider: 'custom',
  model: 'gpt-5.5',
  model_reasoning_effort: 'high',
  disable_response_storage: true,
  model_providers: {
    custom: {
      name: 'OpenAI',
      base_url: 'https://example.com/v1',
      requires_openai_auth: true,
    },
  },
  tui: { status_line_use_colors: true },
  windows: { sandbox: 'elevated' },
};

beforeEach(() => {
  mockedReadJson.mockReset();
  mockedReadToml.mockReset();
  mockedWriteJson.mockReset();
  mockedWriteToml.mockReset();
});

describe('codex-cli 定义', () => {
  it('应包含正确的元数据', () => {
    expect(codexCli.id).toBe('codex-cli');
    expect(codexCli.name).toBe('Codex CLI');
    expect(codexCli.command).toBe('codex');
    expect(codexCli.apiType).toBe('openai');
    expect(codexCli.models).toHaveLength(1);
    expect(codexCli.models[0].slot).toBe('default');
  });

  it('应包含各平台配置目录', () => {
    expect(codexCli.home!.linux).toBe('~/.codex');
    expect(codexCli.home!.macos).toBe('~/.codex');
    expect(codexCli.home!.windows).toBe('~/.codex');
  });
});

describe('codex-cli parseConfig', () => {
  it('应解析完整的 auth.json 和 config.toml', async () => {
    mockedReadJson.mockResolvedValue({ OPENAI_API_KEY: 'sk-test' });
    mockedReadToml.mockResolvedValue(SAMPLE_TOML);

    const result = await codexCli.loadNativeConfig();

    expect(result).not.toBeNull();
    expect(result!.apiKey).toBe('sk-test');
    expect(result!.baseUrl).toBe('https://example.com/v1');
    expect(result!.models).toEqual([{ slot: 'default', id: 'gpt-5.5' }]);
  });

  it('auth.json 不存在时应返回无 apiKey', async () => {
    mockedReadJson.mockResolvedValue(null);
    mockedReadToml.mockResolvedValue(SAMPLE_TOML);

    const result = await codexCli.loadNativeConfig();

    expect(result).not.toBeNull();
    expect(result!.apiKey).toBeUndefined();
    expect(result!.baseUrl).toBe('https://example.com/v1');
    expect(result!.models).toEqual([{ slot: 'default', id: 'gpt-5.5' }]);
  });

  it('config.toml 不存在时应返回空模型列表', async () => {
    mockedReadJson.mockResolvedValue({ OPENAI_API_KEY: 'sk-test' });
    mockedReadToml.mockResolvedValue(null);

    const result = await codexCli.loadNativeConfig();

    expect(result).not.toBeNull();
    expect(result!.apiKey).toBe('sk-test');
    expect(result!.baseUrl).toBeUndefined();
    expect(result!.models).toEqual([]);
  });

  it('两个文件都不存在时应返回空配置', async () => {
    mockedReadJson.mockResolvedValue(null);
    mockedReadToml.mockResolvedValue(null);

    const result = await codexCli.loadNativeConfig();

    expect(result).not.toBeNull();
    expect(result!.apiKey).toBeUndefined();
    expect(result!.baseUrl).toBeUndefined();
    expect(result!.models).toEqual([]);
  });

  it('应从 model_providers 中读取当前 provider 的 base_url', async () => {
    mockedReadJson.mockResolvedValue(null);
    mockedReadToml.mockResolvedValue({
      model_provider: 'my-provider',
      model: 'gpt-4o',
      model_providers: {
        'my-provider': { name: 'My API', base_url: 'https://my.api.com/v1' },
        'other': { name: 'Other', base_url: 'https://other.com/v1' },
      },
    });

    const result = await codexCli.loadNativeConfig();

    expect(result!.baseUrl).toBe('https://my.api.com/v1');
  });

  it('model_provider 指向不存在的 provider 时应返回无 baseUrl', async () => {
    mockedReadJson.mockResolvedValue(null);
    mockedReadToml.mockResolvedValue({
      model_provider: 'nonexistent',
      model: 'gpt-4o',
      model_providers: {},
    });

    const result = await codexCli.loadNativeConfig();

    expect(result!.baseUrl).toBeUndefined();
  });
});

describe('codex-cli saveConfig', () => {
  it('应正确写出 apiKey 到 auth.json', async () => {
    mockedReadJson.mockResolvedValue({ OPENAI_API_KEY: 'old-key' });
    mockedReadToml.mockResolvedValue(SAMPLE_TOML);

    await codexCli.saveNativeConfig!({ apiKey: 'new-key' });

    expect(mockedWriteJson).toHaveBeenCalledOnce();
    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, string>;
    expect(saved.OPENAI_API_KEY).toBe('new-key');
  });

  it('auth.json 不存在时应创建新文件', async () => {
    mockedReadJson.mockResolvedValue(null);
    mockedReadToml.mockResolvedValue(SAMPLE_TOML);

    await codexCli.saveNativeConfig!({ apiKey: 'sk-new' });

    expect(mockedWriteJson).toHaveBeenCalledOnce();
    const saved = mockedWriteJson.mock.calls[0][1] as Record<string, string>;
    expect(saved.OPENAI_API_KEY).toBe('sk-new');
  });

  it('应正确写出 model 到 config.toml', async () => {
    mockedReadJson.mockResolvedValue(null);
    mockedReadToml.mockResolvedValue(SAMPLE_TOML);

    await codexCli.saveNativeConfig!({ models: [{ slot: 'default', id: 'gpt-4o' }] });

    expect(mockedWriteToml).toHaveBeenCalledOnce();
    const saved = mockedWriteToml.mock.calls[0][1] as Record<string, unknown>;
    expect(saved.model).toBe('gpt-4o');
  });

  it('应正确写出 baseUrl 到 model_providers', async () => {
    mockedReadJson.mockResolvedValue(null);
    mockedReadToml.mockResolvedValue(SAMPLE_TOML);

    await codexCli.saveNativeConfig!({ baseUrl: 'https://new.api.com/v1' });

    expect(mockedWriteToml).toHaveBeenCalledOnce();
    const saved = mockedWriteToml.mock.calls[0][1] as Record<string, unknown>;
    const providers = saved.model_providers as Record<string, Record<string, unknown>>;
    expect(saved.model_provider).toBe('custom');
    expect(providers.custom.base_url).toBe('https://new.api.com/v1');
    expect(providers.custom.requires_openai_auth).toBe(true);
  });

  it('应保留 config.toml 中的其它无关字段', async () => {
    mockedReadJson.mockResolvedValue(null);
    mockedReadToml.mockResolvedValue(SAMPLE_TOML);

    await codexCli.saveNativeConfig!({ models: [{ slot: 'default', id: 'gpt-4o' }] });

    const saved = mockedWriteToml.mock.calls[0][1] as Record<string, unknown>;
    expect(saved.tui).toEqual({ status_line_use_colors: true });
    expect(saved.windows).toEqual({ sandbox: 'elevated' });
    expect(saved.model_reasoning_effort).toBe('high');
    expect(saved.disable_response_storage).toBe(true);
  });

  it('应保留已有的其它 provider 定义', async () => {
    mockedReadJson.mockResolvedValue(null);
    mockedReadToml.mockResolvedValue({
      model_provider: 'custom',
      model: 'gpt-5.5',
      model_providers: {
        custom: { name: 'OpenAI', base_url: 'https://old.com/v1' },
        backup: { name: 'Backup', base_url: 'https://backup.com/v1' },
      },
    });

    await codexCli.saveNativeConfig!({ baseUrl: 'https://new.com/v1' });

    const saved = mockedWriteToml.mock.calls[0][1] as Record<string, unknown>;
    const providers = saved.model_providers as Record<string, Record<string, unknown>>;
    expect(providers.custom.base_url).toBe('https://new.com/v1');
    expect(providers.backup).toEqual({ name: 'Backup', base_url: 'https://backup.com/v1' });
  });

  it('不应覆盖未传入的字段', async () => {
    mockedReadJson.mockResolvedValue({ OPENAI_API_KEY: 'existing-key' });
    mockedReadToml.mockResolvedValue(SAMPLE_TOML);

    await codexCli.saveNativeConfig!({ models: [{ slot: 'default', id: 'gpt-4o' }] });

    expect(mockedWriteJson).not.toHaveBeenCalled();
    const saved = mockedWriteToml.mock.calls[0][1] as Record<string, unknown>;
    expect(saved.model).toBe('gpt-4o');
    expect(saved.model_provider).toBe('custom');
  });

  it('config.toml 不存在时应创建新文件', async () => {
    mockedReadJson.mockResolvedValue(null);
    mockedReadToml.mockResolvedValue(null);

    await codexCli.saveNativeConfig!({
      apiKey: 'sk-new',
      baseUrl: 'https://api.new.com/v1',
      models: [{ slot: 'default', id: 'gpt-4o' }],
    });

    expect(mockedWriteJson).toHaveBeenCalledOnce();
    expect(mockedWriteToml).toHaveBeenCalledOnce();
    const savedToml = mockedWriteToml.mock.calls[0][1] as Record<string, unknown>;
    expect(savedToml.model).toBe('gpt-4o');
    expect(savedToml.model_provider).toBe('agentbaton');
  });
});
