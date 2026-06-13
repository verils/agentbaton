import { describe, it, expect } from 'vitest';
import { builtinAgents } from "../src/agent/builtin";
import { providerPresets } from "../src/provider/presets";

describe('内置智能体', () => {
  it('应包含 claude-code', () => {
    const claudeCode = builtinAgents.find((a) => a.id === 'claude-code');
    expect(claudeCode).toBeDefined();
    expect(claudeCode?.name).toBe('Claude Code');
    expect(claudeCode?.apiType).toBe('anthropic');
  });

  it('应包含 codex-cli', () => {
    const codexCli = builtinAgents.find((a) => a.id === 'codex-cli');
    expect(codexCli).toBeDefined();
    expect(codexCli?.apiType).toBe('openai');
  });
});

describe('内置供应商预设', () => {
  it('应包含 deepseek', () => {
    const deepseek = providerPresets.find((p) => p.id === 'deepseek');
    expect(deepseek).toBeDefined();
    expect(deepseek?.name).toBe('DeepSeek');
    expect(deepseek?.models.length).toBeGreaterThan(0);
  });

  it('应包含阿里云百炼', () => {
    const bailian = providerPresets.find((p) => p.id === 'bailian');
    expect(bailian).toBeDefined();
    expect(bailian?.name).toBe('阿里云百炼');
  });
});
