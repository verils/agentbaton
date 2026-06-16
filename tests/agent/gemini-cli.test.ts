import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
}));

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

const { existsSync } = await import('node:fs');
const { readFile, writeFile } = await import('node:fs/promises');
const mockedExistsSync = vi.mocked(existsSync);
const mockedReadFile = vi.mocked(readFile);
const mockedWriteFile = vi.mocked(writeFile);

const { geminiCli } = await import('../../src/agent/gemini-cli');

beforeEach(() => {
  mockedExistsSync.mockReset();
  mockedReadFile.mockReset();
  mockedWriteFile.mockReset();
  mockedExistsSync.mockReturnValue(true);
});

describe('gemini-cli 定义', () => {
  it('应包含正确的元数据', () => {
    expect(geminiCli.id).toBe('gemini-cli');
    expect(geminiCli.name).toBe('Gemini CLI');
    expect(geminiCli.command).toBe('gemini');
    expect(geminiCli.apiType).toBe('google');
    expect(geminiCli.models).toHaveLength(1);
    expect(geminiCli.models[0].slot).toBe('default');
  });

  it('应包含各平台配置路径', () => {
    expect(geminiCli.home!.linux).toBe('~/.gemini');
    expect(geminiCli.home!.macos).toBe('~/.gemini');
    expect(geminiCli.home!.windows).toBe('~/.gemini');
  });
});

describe('gemini-cli parseConfig', () => {
  it('应解析完整的 .env 文件', async () => {
    mockedReadFile.mockResolvedValue(
      'GEMINI_API_KEY=sk-test-key\nGEMINI_MODEL=gemini-3.5-flash\nGOOGLE_GEMINI_BASE_URL=https://custom.google.com\n'
    );

    const result = await geminiCli.loadConfig();

    expect(result).not.toBeNull();
    expect(result!.apiKey).toBe('sk-test-key');
    expect(result!.baseUrl).toBe('https://custom.google.com');
    expect(result!.models).toEqual([{ slot: 'default', id: 'gemini-3.5-flash' }]);
  });

  it('.env 文件不存在时应返回 null', async () => {
    mockedExistsSync.mockReturnValue(false);

    const result = await geminiCli.loadConfig();

    expect(result).toBeNull();
  });

  it('.env 为空文件时应返回 null', async () => {
    mockedReadFile.mockResolvedValue('');

    const result = await geminiCli.loadConfig();

    expect(result).toBeNull();
  });

  it('仅有 apiKey 时应正确解析', async () => {
    mockedReadFile.mockResolvedValue('GEMINI_API_KEY=sk-only\n');

    const result = await geminiCli.loadConfig();

    expect(result).not.toBeNull();
    expect(result!.apiKey).toBe('sk-only');
    expect(result!.baseUrl).toBeUndefined();
    expect(result!.models).toEqual([]);
  });

  it('仅有 baseUrl 时应正确解析', async () => {
    mockedReadFile.mockResolvedValue('GOOGLE_GEMINI_BASE_URL=https://proxy.google.com\n');

    const result = await geminiCli.loadConfig();

    expect(result).not.toBeNull();
    expect(result!.baseUrl).toBe('https://proxy.google.com');
    expect(result!.apiKey).toBeUndefined();
    expect(result!.models).toEqual([]);
  });

  it('仅有 model 时应正确解析', async () => {
    mockedReadFile.mockResolvedValue('GEMINI_MODEL=gemini-2.0-flash\n');

    const result = await geminiCli.loadConfig();

    expect(result).not.toBeNull();
    expect(result!.models).toEqual([{ slot: 'default', id: 'gemini-2.0-flash' }]);
    expect(result!.apiKey).toBeUndefined();
    expect(result!.baseUrl).toBeUndefined();
  });

  it('应忽略注释行和空行', async () => {
    mockedReadFile.mockResolvedValue(
      '# This is a comment\n\nGEMINI_API_KEY=sk-test\n# Another comment\nGEMINI_MODEL=gemini-pro\n'
    );

    const result = await geminiCli.loadConfig();

    expect(result).not.toBeNull();
    expect(result!.apiKey).toBe('sk-test');
    expect(result!.models).toEqual([{ slot: 'default', id: 'gemini-pro' }]);
  });

  it('应忽略不相关的环境变量', async () => {
    mockedReadFile.mockResolvedValue(
      'GEMINI_API_KEY=sk-test\nOTHER_VAR=ignored\nGEMINI_MODEL=gemini-pro\n'
    );

    const result = await geminiCli.loadConfig();

    expect(result).not.toBeNull();
    expect(result!.apiKey).toBe('sk-test');
    expect(result!.models).toEqual([{ slot: 'default', id: 'gemini-pro' }]);
  });
});

describe('gemini-cli saveConfig', () => {
  it('应正确写出所有字段到新文件', async () => {
    mockedExistsSync.mockReturnValue(false);

    await geminiCli.saveConfig({
      apiKey: 'sk-new',
      baseUrl: 'https://api.google.com',
      models: [{ slot: 'default', id: 'gemini-3.5-flash' }],
    });

    expect(mockedWriteFile).toHaveBeenCalledOnce();
    const content = mockedWriteFile.mock.calls[0][1] as string;
    expect(content).toContain('GEMINI_API_KEY=sk-new');
    expect(content).toContain('GOOGLE_GEMINI_BASE_URL=https://api.google.com');
    expect(content).toContain('GEMINI_MODEL=gemini-3.5-flash');
  });

  it('应保留已有的但未传入的字段', async () => {
    mockedReadFile.mockResolvedValue(
      'GEMINI_API_KEY=old-key\nGEMINI_MODEL=old-model\nOTHER_VAR=keep\n'
    );

    await geminiCli.saveConfig({ apiKey: 'new-key' });

    const content = mockedWriteFile.mock.calls[0][1] as string;
    expect(content).toContain('GEMINI_API_KEY=new-key');
    expect(content).toContain('GEMINI_MODEL=old-model');
    expect(content).toContain('OTHER_VAR=keep');
  });

  it('应覆盖已有的同类字段', async () => {
    mockedReadFile.mockResolvedValue(
      'GEMINI_API_KEY=old-key\nGEMINI_MODEL=old-model\n'
    );

    await geminiCli.saveConfig({
      apiKey: 'new-key',
      models: [{ slot: 'default', id: 'new-model' }],
    });

    const content = mockedWriteFile.mock.calls[0][1] as string;
    expect(content).toContain('GEMINI_API_KEY=new-key');
    expect(content).toContain('GEMINI_MODEL=new-model');
    expect(content).not.toContain('old-key');
    expect(content).not.toContain('old-model');
  });

  it('文件不存在时不应抛出异常', async () => {
    mockedExistsSync.mockReturnValue(false);

    await expect(
      geminiCli.saveConfig({ apiKey: 'sk-new' })
    ).resolves.not.toThrow();

    expect(mockedWriteFile).toHaveBeenCalledOnce();
  });
});
