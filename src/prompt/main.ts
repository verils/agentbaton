import { intro, isCancel, outro, select } from '@clack/prompts';
import { getEnabledState, loadConfig } from '../config';
import { getStringWidth, isCommandAvailable, padEndWidth } from '../utils';
import { openAgentMenu } from './agent';
import { openProviderMenu } from './provider';
import { builtinAgents } from "../agent/builtin";

export async function runPrompt(): Promise<void> {
  intro('Agent Baton — 智能体设置管理');

  while (true) {
    const choice = await select({
      message: '选择菜单：',
      options: [
        { value: 'agent', label: '设置智能体' },
        { value: 'provider', label: '设置模型供应商' },
        { value: 'view', label: '查看当前设置' },
        { value: 'exit', label: '退出' },
      ],
    });

    if (isCancel(choice) || choice === 'exit') break;

    switch (choice) {
      case 'agent':
        await openAgentMenu();
        break;
      case 'provider':
        await openProviderMenu();
        break;
      case 'view':
        await handleViewAll();
        break;
    }
  }

  outro('👋 再见');
}

/**
 * 查看配置 — 展示所有智能体和供应商的配置概览
 */
async function handleViewAll(): Promise<void> {
  const config = await loadConfig();
  const enabledState = await getEnabledState();

  // 智能体
  console.log('\n  🤖 智能体\n');
  const agentWidth = Math.max(...builtinAgents.map(a => getStringWidth(a.displayName))) + 4;
  for (const agent of builtinAgents) {
    const installed = await isCommandAvailable(agent.command);
    const state = enabledState[agent.name];
    const status = installed ? '✅' : '❌';
    console.log(`    ${padEndWidth(agent.displayName, agentWidth)} ${status}`);

    if (state?.modelAssignments) {
      for (const slot of agent.models) {
        const model = state.modelAssignments[slot.slot];
        if (model) {
          console.log(`    ${slot.description}: ${model}`);
        }
      }
    }
  }

  // 模型供应商
  console.log('\n  🔌 模型供应商\n');
  for (const provider of config.providers) {
    console.log(`    ${provider.name}`);
  }

  console.log();
}
