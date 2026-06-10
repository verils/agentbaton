import { describe, it, expect } from 'vitest';
import { builtinAgents } from '../src/builtins/agents/index';
import { builtinProviders } from '../src/builtins/providers/index';

describe('Built-in Agents', () => {
  it('should have claude-code agent', () => {
    const claudeCode = builtinAgents.find((a) => a.name === 'claude-code');
    expect(claudeCode).toBeDefined();
    expect(claudeCode?.displayName).toBe('Claude Code');
    expect(claudeCode?.apiType).toBe('anthropic');
  });

  it('should have codex-cli agent', () => {
    const codexCli = builtinAgents.find((a) => a.name === 'codex-cli');
    expect(codexCli).toBeDefined();
    expect(codexCli?.apiType).toBe('openai');
  });

  it('should have gemini-cli agent', () => {
    const geminiCli = builtinAgents.find((a) => a.name === 'gemini-cli');
    expect(geminiCli).toBeDefined();
    expect(geminiCli?.apiType).toBe('google');
  });
});

describe('Built-in Providers', () => {
  it('should have deepseek provider', () => {
    const deepseek = builtinProviders.find((p) => p.name === 'deepseek');
    expect(deepseek).toBeDefined();
    expect(deepseek?.displayName).toBe('DeepSeek');
    expect(deepseek?.apiType).toBe('openai');
    expect(deepseek?.models.length).toBeGreaterThan(0);
  });

  it('should have bailian provider', () => {
    const bailian = builtinProviders.find((p) => p.name === 'bailian');
    expect(bailian).toBeDefined();
    expect(bailian?.displayName).toBe('百炼 (Bailian)');
  });
});
