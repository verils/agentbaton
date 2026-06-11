import { builtinAgents } from "./builtin";
import { isCommandAvailable } from "../utils";
import { AgentDefinition } from "../types";

export async function detectInstalledAgents(): Promise<AgentDefinition[]> {
  return await Promise.all(
    builtinAgents.filter(async (a) => await isCommandAvailable(a.command))
  );
}
