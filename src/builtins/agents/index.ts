import type { AgentDefinition } from '../../types';
import { claudeCode } from './claude-code';
import { codexCli } from './codex-cli';
import { geminiCli } from './gemini-cli';
import { opencode } from './opencode';

export const builtinAgents: AgentDefinition[] = [
  claudeCode,
  codexCli,
  geminiCli,
  opencode,
];
