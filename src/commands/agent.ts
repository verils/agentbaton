import { Command } from 'commander';
import { builtinAgents } from '../agents/index';
import { getEnabledState } from '../config/state';
import { isCommandAvailable, getConfigPath, expandHome } from '../utils/path';
import type { AgentDefinition } from '../types/agent';

/**
 * 加载所有 agent 定义（内置 + 用户自定义）
 */
async function loadAgents(): Promise<AgentDefinition[]> {
  // TODO: 加载用户自定义 agent 定义
  return builtinAgents;
}

/**
 * 创建 agent 命令
 */
export function createAgentCommand(): Command {
  const cmd = new Command('agent')
    .description('智能体管理')
    .argument('[name]', '智能体名称')
    .action(async (name?: string) => {
      const agents = await loadAgents();
      const enabledState = await getEnabledState();

      if (name) {
        // 显示单个 agent 详情
        const agent = agents.find((a) => a.name === name);
        if (!agent) {
          console.error(`未找到智能体: ${name}`);
          process.exit(1);
        }
        await displayAgentDetail(agent, enabledState);
      } else {
        // 列出所有 agent
        await displayAgentList(agents);
      }
    });

  return cmd;
}

async function displayAgentList(agents: AgentDefinition[]): Promise<void> {
  console.log('\n已识别的智能体:\n');
  for (const agent of agents) {
    const installed = await isCommandAvailable(agent.command);
    const status = installed ? '✅ 已安装' : '❌ 未安装';
    console.log(`  ${agent.displayName.padEnd(20)} ${status}  (${agent.apiType})`);
  }
  console.log();
}

async function displayAgentDetail(
  agent: AgentDefinition,
  enabledState: Record<string, { provider: string; modelAssignments: Record<string, string> }>,
): Promise<void> {
  const installed = await isCommandAvailable(agent.command);
  const configPath = expandHome(getConfigPath(agent.configPath));
  const state = enabledState[agent.name];

  console.log(`\n${agent.displayName}`);
  console.log('─'.repeat(40));
  console.log(`  名称:     ${agent.name}`);
  console.log(`  API 类型: ${agent.apiType}`);
  console.log(`  配置文件: ${configPath}  ${installed ? '✅' : '❌'}`);
  console.log();

  if (agent.models.length > 0) {
    console.log('  模型设置:');
    for (const model of agent.models) {
      const assigned = state?.modelAssignments?.[model.slot];
      const assignment = assigned ? ` → ${assigned}` : '';
      console.log(`    ${model.slot.padEnd(12)} ${model.description}${assignment}`);
    }
  }

  if (state) {
    console.log(`\n  已启用 Provider: ${state.provider}`);
  }

  console.log();
}
