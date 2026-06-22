import type {AgentDefinition} from "../types/index.js";
import {claudeCode} from "./claude-code.js";
import {codexCli} from "./codex-cli.js";
import {geminiCli} from "./gemini-cli.js";
import {opencode} from "./opencode.js";
import { pi } from "./pi.js";
import { cline } from "./cline.js";

export const builtinAgents: AgentDefinition[] = [
  claudeCode,
  cline,
  codexCli,
  geminiCli,
  opencode,
  pi,
  // mimoCode,
  // qoder,
  // qoderCn,
  // qwenCode
];

export function findAgent(id: string): AgentDefinition {
  return builtinAgents.find(a => a.id === id)!;
}
