import { intro, isCancel, outro, select } from '@clack/prompts';
import { builtinAgents } from '../agents';
import { builtinProviders } from '../providers';
import { getEnabledState, getProviderKeys } from '../config';
import { isCommandAvailable } from '../utils';
import { runAgentPrompt } from './agent';
import { runProviderPrompt } from './provider';

export async function runPrompt(): Promise<void> {
  intro('Agent Baton — 智能体设置管理');

  while (true) {
    const choice = await select({
      message: '选择菜单：',
      options: [
        { value: 'provider', label: '设置模型供应商' },
        { value: 'agent', label: '设置智能体' },
        { value: 'view', label: '查看当前设置' },
        { value: 'exit', label: '退出' },
      ],
    });

    if (isCancel(choice) || choice === 'exit') break;

    switch (choice) {
      case 'agent':
        await runAgentPrompt();
        break;
      case 'provider':
        await runProviderPrompt();
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
  const keys = await getProviderKeys();
  const enabledState = await getEnabledState();

  // 智能体
  console.log('\n  🤖 智能体\n');
  for (const agent of builtinAgents) {
    const installed = await isCommandAvailable(agent.command);
    const state = enabledState[agent.name];
    const status = installed ? '✅' : '❌';
    console.log(`    ${agent.displayName.padEnd(18)} ${status}`);

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
  for (const provider of builtinProviders) {
    const hasKey = keys[provider.name] ? '✅' : '❌';
    console.log(`    ${provider.displayName.padEnd(18)} ${hasKey}`);
  }

  console.log();
}
