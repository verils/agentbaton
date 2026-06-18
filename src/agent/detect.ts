import {builtinAgents} from "./builtin";
import {AgentDefinition} from "../types";

const commandCache = new Map<string, boolean>();

/**
 * 检查命令是否可执行（结果会缓存，同一进程内不会重复调用 where/which）
 */
export async function isCommandAvailable(command: string): Promise<boolean> {
  if (commandCache.has(command)) {
    return commandCache.get(command)!;
  }
  const {execSync} = await import('node:child_process');
  let available: boolean;
  try {
    const checkCmd = process.platform === 'win32'
      ? `where ${command}`
      : `which ${command}`;
    execSync(checkCmd, {stdio: 'ignore'});
    available = true;
  } catch {
    available = false;
  }
  commandCache.set(command, available);
  return available;
}

export async function detectInstalledAgents(): Promise<AgentDefinition[]> {
  const results = await Promise.all(
    builtinAgents.map(async (a) => ({ agent: a, available: await isCommandAvailable(a.command) }))
  );
  return results.filter((r) => r.available).map((r) => r.agent);
}
