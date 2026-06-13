import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

vi.mock('../../src/config', () => ({
  readJson: vi.fn(),
  writeJson: vi.fn(),
}));

const { readJson } = await import('../../src/config');
const mockedReadJson = vi.mocked(readJson);

const { claudeCode } = await import('../../src/agent/claude-code');

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'claude-code-test-'));
  mockedReadJson.mockReset();
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('claude-code 定义', () => {
  it('应包含正确的元数据', () => {
    expect(claudeCode.id).toBe('claude-code');
    expect(claudeCode.name).toBe('Claude Code');
    expect(claudeCode.command).toBe('claude');
    expect(claudeCode.apiType).toBe('anthropic');
    expect(claudeCode.configFormat).toBe('json');
    expect(claudeCode.models).toHaveLength(3);
    expect(claudeCode.models.map(m => m.slot)).toEqual(['opus', 'sonnet', 'haiku']);
  });

  it('应包含各平台配置路径', () => {
    expect(claudeCode.configPaths.linux).toContain('.claude');
    expect(claudeCode.configPaths.macos).toContain('.claude');
    expect(claudeCode.configPaths.windows).toContain('.claude');
  });
});

describe('claude-code parseConfig', () => {
  it('应解析完整的 settings.json', async () => {
    mockedReadJson.mockResolvedValue({
      env: {
        ANTHROPIC_API_KEY: 'sk-ant-test',
        ANTHROPIC_BASE_URL: 'https://custom.anthropic.com',
        ANTHROPIC_DEFAULT_OPUS_MODEL: 'claude-opus-4',
        ANTHROPIC_DEFAULT_OPUS_MODEL_NAME: 'Opus',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'claude-sonnet-4',
        ANTHROPIC_DEFAULT_SONNET_MODEL_NAME: 'Sonnet',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: 'claude-haiku-3',
        ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME: 'Haiku',
      },
    });

    const result = await claudeCode.parseConfig();
    expect(result).not.toBeNull();
    expect(result!.apiKey).toBe('sk-ant-test');
    expect(result!.baseUrl).toBe('https://custom.anthropic.com');
    expect(result!.models).toEqual([
      { slot: 'opus', id: 'claude-opus-4' },
      { slot: 'sonnet', id: 'claude-sonnet-4' },
      { slot: 'haiku', id: 'claude-haiku-3' },
    ]);
  });

  it('文件不存在时应返回空模型列表', async () => {
    mockedReadJson.mockResolvedValue(null);

    const result = await claudeCode.parseConfig();
    expect(result).not.toBeNull();
    expect(result!.models).toEqual([]);
    expect(result!.apiKey).toBeUndefined();
    expect(result!.baseUrl).toBeUndefined();
  });

  it('缺少 env 字段时应返回空模型列表', async () => {
    mockedReadJson.mockResolvedValue({});

    const result = await claudeCode.parseConfig();
    expect(result).not.toBeNull();
    expect(result!.models).toEqual([]);
    expect(result!.apiKey).toBeUndefined();
    expect(result!.baseUrl).toBeUndefined();
  });

  it('env 为空对象时应返回空模型列表', async () => {
    mockedReadJson.mockResolvedValue({ env: {} });

    const result = await claudeCode.parseConfig();
    expect(result).not.toBeNull();
    expect(result!.models).toEqual([]);
    expect(result!.apiKey).toBeUndefined();
    expect(result!.baseUrl).toBeUndefined();
  });

  it('仅有部分模型时应只返回已配置的槽位', async () => {
    mockedReadJson.mockResolvedValue({
      env: { ANTHROPIC_DEFAULT_SONNET_MODEL: 'claude-sonnet-4' },
    });

    const result = await claudeCode.parseConfig();
    expect(result).not.toBeNull();
    expect(result!.models).toEqual([
      { slot: 'sonnet', id: 'claude-sonnet-4' },
    ]);
  });

  it('仅有 apiKey 时应正确解析', async () => {
    mockedReadJson.mockResolvedValue({
      env: { ANTHROPIC_API_KEY: 'sk-ant-only' },
    });

    const result = await claudeCode.parseConfig();
    expect(result).not.toBeNull();
    expect(result!.apiKey).toBe('sk-ant-only');
    expect(result!.baseUrl).toBeUndefined();
    expect(result!.models).toEqual([]);
  });

  it('仅有 baseUrl 时应正确解析', async () => {
    mockedReadJson.mockResolvedValue({
      env: { ANTHROPIC_BASE_URL: 'https://proxy.anthropic.com' },
    });

    const result = await claudeCode.parseConfig();
    expect(result).not.toBeNull();
    expect(result!.baseUrl).toBe('https://proxy.anthropic.com');
    expect(result!.apiKey).toBeUndefined();
    expect(result!.models).toEqual([]);
  });
});

describe('claude-code saveConfig', () => {
  it('保存前应先读取已有配置', async () => {
    mockedReadJson.mockResolvedValue({
      env: { ANTHROPIC_API_KEY: 'old-key' },
    });

    await claudeCode.saveConfig!({
      baseUrl: 'https://new.endpoint.com',
      apiKey: 'new-key',
    });

    expect(mockedReadJson).toHaveBeenCalledOnce();
  });

  it('文件不存在时不应抛出异常', async () => {
    mockedReadJson.mockResolvedValue(null);

    await expect(
      claudeCode.saveConfig!({ apiKey: 'sk-ant-new', baseUrl: 'https://api.anthropic.com' })
    ).resolves.not.toThrow();
  });

  it('配置为空对象时不应抛出异常', async () => {
    mockedReadJson.mockResolvedValue({});

    await expect(
      claudeCode.saveConfig!({ apiKey: 'sk-ant-new' })
    ).resolves.not.toThrow();
  });
});
