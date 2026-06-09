import type { AgentDefinition } from '../../types/agent.js';
import { claudeCode } from './claude-code.js';
import { codexCli } from './codex-cli.js';
import { geminiCli } from './gemini-cli.js';
import { opencode } from './opencode.js';

export const builtinAgents: AgentDefinition[] = [
  claudeCode,
  codexCli,
  geminiCli,
  opencode,
];
