import { builtinAgents } from "./builtin";
import { isCommandAvailable } from "../utils";
import { AgentDefinition } from "../types";

export async function detectInstalledAgents(): Promise<AgentDefinition[]> {
  const results = await Promise.all(
    builtinAgents.map(async (a) => ({ agent: a, available: await isCommandAvailable(a.command) }))
  );
  return results.filter((r) => r.available).map((r) => r.agent);
}
