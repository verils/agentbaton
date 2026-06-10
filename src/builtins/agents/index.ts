import type { AgentDefinition } from '../../types';
import { claudeCode } from './claude-code';
import { codexCli } from './codex-cli';
import { geminiCli } from './gemini-cli';
import { opencode } from './opencode';
import { qoder } from './qoder';
import { qoderCn } from './qoder-cn';
import { qwenCode } from './qwen-code';

export const builtinAgents: AgentDefinition[] = [
  claudeCode,
  codexCli,
  geminiCli,
  opencode,
  qoder,
  qoderCn,
  qwenCode,
];
