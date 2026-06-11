import { intro, outro, select, confirm, isCancel } from '@clack/prompts';
import { builtinAgents } from '../agents';
import { builtinProviders } from '../providers';
import { getProviderKeys, getEnabledState, setEnabledState } from '../config';
import { isCommandAvailable } from '../utils';
import { runAgentFlow } from './agent';
import { runProviderPrompt } from './provider';

export async function runPrompt(): Promise<void> {
  intro('Agent Baton — 智能体设置管理');

  while (true) {
    const choice = await select({
      message: '选择菜单：',
      options: [
        { value: 'provider', label: '设置模型供应商', hint: '设置 API Key 和模型' },
        { value: 'agent', label: '设置智能体', hint: '启用/禁用供应商、分配模型' },
        { value: 'view', label: '查看设置', hint: '所有智能体和供应商的设置概览' },
        { value: 'quick', label: '快速设置', hint: '进入设置向导' },
        { value: 'exit', label: '退出', hint: '' },
      ],
    });

    if (isCancel(choice) || choice === 'exit') break;

    switch (choice) {
      case 'agent':
        await runAgentFlow();
        break;
      case 'provider':
        await runProviderPrompt();
        break;
      case 'view':
        await handleViewAll();
        break;
      case 'quick':
        await handleQuickConfig();
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
    console.log(`    ${status} ${agent.displayName.padEnd(18)}`);

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
    console.log(`    ${hasKey} ${provider.displayName.padEnd(18)}`);
  }

  console.log();
}

/**
 * 快速配置 — 一步到位的配置向导
 */
async function handleQuickConfig(): Promise<void> {
  const keys = await getProviderKeys();

  // 1. 选择智能体
  const installedAgents: typeof builtinAgents = [];
  for (const agent of builtinAgents) {
    if (await isCommandAvailable(agent.command)) {
      installedAgents.push(agent);
    }
  }

  if (installedAgents.length === 0) {
    console.log('\n  ❌ 没有检测到已安装的智能体\n');
    return;
  }

  const agentName = await select({
    message: '选择智能体：',
    options: installedAgents.map((a) => ({
      value: a.name,
      label: a.displayName,
      hint: a.apiType,
    })),
  });

  if (isCancel(agentName)) return;

  const agent = installedAgents.find((a) => a.name === agentName)!;

  // 2. 选择兼容且有 API Key 的供应商
  const compatible = builtinProviders.filter(
    (p) => p.apiType === agent.apiType && keys[p.name],
  );

  if (compatible.length === 0) {
    console.log(`\n  ❌ 没有已配置 API Key 且兼容 ${agent.apiType} 的供应商`);
    console.log('  请先通过「配置供应商」菜单配置 API Key\n');
    return;
  }

  const providerName = await select({
    message: '选择供应商：',
    options: compatible.map((p) => ({
      value: p.name,
      label: p.displayName,
      hint: `${p.models.length} 个模型`,
    })),
  });

  if (isCancel(providerName)) return;

  const provider = compatible.find((p) => p.name === providerName)!;

  // 3. 自动分配默认模型（每个槽位取第一个）
  const modelAssignments: Record<string, string> = {};
  for (const slot of agent.models) {
    modelAssignments[slot.slot] = provider.models[0].name;
  }

  // 4. 显示分配结果并确认
  console.log(`\n  将为 ${agent.displayName} 配置 ${provider.displayName}：`);
  for (const slot of agent.models) {
    console.log(`    ${slot.description} (${slot.slot}): ${modelAssignments[slot.slot]}`);
  }
  console.log();

  const yes = await confirm({ message: '确认配置？' });
  if (isCancel(yes) || !yes) return;

  // 5. 保存
  const enabledState = await getEnabledState();
  enabledState[agent.name] = { provider: provider.name, modelAssignments };
  await setEnabledState(enabledState);

  console.log(`\n  ✅ 快速配置完成\n`);
}
