import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readJson, writeJson, readToml, writeToml } from '../src/config';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'config-io-test-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe('readJson', () => {
  it('文件不存在时应返回 null', async () => {
    const result = await readJson(join(tmpDir, 'nonexistent.json'));
    expect(result).toBeNull();
  });

  it('应正确解析有效 JSON 文件', async () => {
    const filePath = join(tmpDir, 'test.json');
    const data = { foo: 'bar', num: 42 };
    await writeFile(filePath, JSON.stringify(data), 'utf-8');

    const result = await readJson<typeof data>(filePath);
    expect(result).toEqual(data);
  });

  it('应正确解析嵌套结构', async () => {
    const filePath = join(tmpDir, 'nested.json');
    const data = { a: { b: { c: [1, 2, 3] } } };
    await writeFile(filePath, JSON.stringify(data), 'utf-8');

    const result = await readJson(filePath);
    expect(result).toEqual(data);
  });
});

describe('writeJson', () => {
  it('应创建格式化的 JSON 文件', async () => {
    const filePath = join(tmpDir, 'output.json');
    const data = { key: 'value', nested: { a: 1 } };

    await writeJson(filePath, data);

    const content = await readFile(filePath, 'utf-8');
    expect(JSON.parse(content)).toEqual(data);
    expect(content).toContain('  ');
  });

  it('应自动创建父目录', async () => {
    const filePath = join(tmpDir, 'a', 'b', 'c', 'output.json');

    await writeJson(filePath, { ok: true });

    const content = await readFile(filePath, 'utf-8');
    expect(JSON.parse(content)).toEqual({ ok: true });
  });

  it('应覆盖已有文件', async () => {
    const filePath = join(tmpDir, 'overwrite.json');
    await writeFile(filePath, JSON.stringify({ old: true }), 'utf-8');

    await writeJson(filePath, { new: true });

    const content = await readFile(filePath, 'utf-8');
    expect(JSON.parse(content)).toEqual({ new: true });
  });
});

describe('readJson + writeJson 往返一致性', () => {
  it('写入后读取应保持数据一致', async () => {
    const filePath = join(tmpDir, 'roundtrip.json');
    const original = {
      agents: { 'claude-code': { provider: 'deepseek' } },
      providers: [{ id: 'test', name: 'Test', apiKey: 'sk-xxx' }],
    };

    await writeJson(filePath, original);
    const loaded = await readJson<typeof original>(filePath);

    expect(loaded).toEqual(original);
  });

  it('应保留数组和 null 值', async () => {
    const filePath = join(tmpDir, 'types.json');
    const data = { list: [1, 'two', null], flag: false, empty: '' };

    await writeJson(filePath, data);
    const loaded = await readJson(filePath);

    expect(loaded).toEqual(data);
  });
});

describe('readToml', () => {
  it('文件不存在时应返回 null', async () => {
    const result = await readToml(join(tmpDir, 'nonexistent.toml'));
    expect(result).toBeNull();
  });

  it('应正确解析有效 TOML 文件', async () => {
    const filePath = join(tmpDir, 'test.toml');
    const content = 'model = "gpt-4o"\nbase_url = "https://api.openai.com/v1"\n';
    await writeFile(filePath, content, 'utf-8');

    const result = await readToml(filePath) as Record<string, unknown>;
    expect(result.model).toBe('gpt-4o');
    expect(result.base_url).toBe('https://api.openai.com/v1');
  });

  it('应正确解析嵌套表结构', async () => {
    const filePath = join(tmpDir, 'nested.toml');
    const content = [
      'model_provider = "custom"',
      '[model_providers.custom]',
      'name = "OpenAI"',
      'base_url = "https://example.com/v1"',
    ].join('\n');
    await writeFile(filePath, content, 'utf-8');

    const result = await readToml(filePath) as Record<string, unknown>;
    expect(result.model_provider).toBe('custom');
    const providers = result.model_providers as Record<string, Record<string, unknown>>;
    expect(providers.custom.name).toBe('OpenAI');
    expect(providers.custom.base_url).toBe('https://example.com/v1');
  });
});

describe('writeToml', () => {
  it('应创建有效的 TOML 文件', async () => {
    const filePath = join(tmpDir, 'output.toml');
    const data = { model: 'gpt-4o', base_url: 'https://api.openai.com/v1' };

    await writeToml(filePath, data);

    const content = await readFile(filePath, 'utf-8');
    expect(content).toContain('model = "gpt-4o"');
    expect(content).toContain('base_url = "https://api.openai.com/v1"');
  });

  it('应自动创建父目录', async () => {
    const filePath = join(tmpDir, 'a', 'b', 'output.toml');

    await writeToml(filePath, { ok: true });

    const content = await readFile(filePath, 'utf-8');
    expect(content).toContain('ok = true');
  });

  it('应正确序列化嵌套表', async () => {
    const filePath = join(tmpDir, 'nested.toml');
    const data = {
      model_provider: 'custom',
      model_providers: {
        custom: { name: 'OpenAI', base_url: 'https://example.com/v1' },
      },
    };

    await writeToml(filePath, data);

    const content = await readFile(filePath, 'utf-8');
    expect(content).toContain('model_provider = "custom"');
    expect(content).toContain('name = "OpenAI"');
  });
});

describe('readToml + writeToml 往返一致性', () => {
  it('写入后读取应保持数据一致', async () => {
    const filePath = join(tmpDir, 'roundtrip.toml');
    const original = {
      model: 'gpt-5.5',
      model_provider: 'custom',
      model_reasoning_effort: 'high',
      model_providers: {
        custom: { name: 'OpenAI', base_url: 'https://example.com/v1' },
      },
    };

    await writeToml(filePath, original);
    const loaded = await readToml<typeof original>(filePath);

    expect(loaded).toEqual(original);
  });
});
