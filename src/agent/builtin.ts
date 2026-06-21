import type {AgentDefinition} from "../types";
import {claudeCode} from "./claude-code";
import {codexCli} from "./codex-cli";
import {geminiCli} from "./gemini-cli";
import {opencode} from "./opencode";
import { pi } from "./pi";
import { cline } from "./cline";

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
