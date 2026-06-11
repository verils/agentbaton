import { select, confirm, isCancel } from '@clack/prompts';
import { builtinAgents } from '../agents';
import { builtinProviders } from '../providers';
import { getProviderKeys, getEnabledState, setEnabledState } from '../config';
import { isCommandAvailable, getConfigPath, expandHome } from '../utils';
import type { AgentDefinition } from '../types';

/**
 * 配置智能体子流程
 */
export async function runAgentFlow(): Promise<void> {
  // 列出所有 agent，标注安装状态
  const agentOptions = await Promise.all(
    builtinAgents.map(async (a) => {
      const installed = await isCommandAvailable(a.command);
      return {
        value: a.name,
        label: a.displayName,
        hint: installed ? '✅ 已安装' : '❌ 未安装',
      };
    })
  );

  const agentName = await select({
    message: '选择智能体：',
    options: [...agentOptions, { value: '__back__', label: '↩ 返回', hint: '' }],
  });

  if (isCancel(agentName) || agentName === '__back__') return;

  const agent = builtinAgents.find((a) => a.name === agentName)!;

  // 操作子菜单循环
  while (true) {
    const action = await select({
      message: `${agent.displayName}：`,
      options: [
        { value: 'view', label: '查看当前配置', hint: '已启用的供应商、模型分配' },
        { value: 'enable', label: '启用新供应商', hint: '选择供应商并分配模型' },
        { value: 'switch', label: '切换供应商', hint: '切换到其他已配置的供应商' },
        { value: 'disable', label: '禁用当前供应商', hint: '移除当前配置' },
        { value: '__back__', label: '↩ 返回', hint: '' },
      ],
    });

    if (isCancel(action) || action === '__back__') return;

    switch (action) {
      case 'view':
        await handleView(agent);
        break;
      case 'enable':
        await handleEnable(agent);
        break;
      case 'switch':
        await handleSwitch(agent);
        break;
      case 'disable':
        await handleDisable(agent);
        break;
    }
  }
}

/**
 * 查看当前配置
 */
async function handleView(agent: AgentDefinition): Promise<void> {
  const enabledState = await getEnabledState();
  const state = enabledState[agent.name];
  const installed = await isCommandAvailable(agent.command);
  const configPath = expandHome(getConfigPath(agent.configPath));

  console.log(`\n  ${agent.displayName}`);
  console.log(`  ${'─'.repeat(40)}`);
  console.log(`  安装状态: ${installed ? '✅ 已安装' : '❌ 未安装'}`);
  console.log(`  配置文件: ${configPath}`);
  console.log(`  API 类型: ${agent.apiType}`);

  if (agent.models.length > 0) {
    console.log('\n  模型槽位:');
    for (const slot of agent.models) {
      const assigned = state?.modelAssignments?.[slot.slot];
      const display = assigned ? `→ ${assigned}` : '—';
      console.log(`    ${slot.description} (${slot.slot}): ${display}`);
    }
  }

  if (state) {
    console.log(`\n  已启用供应商: ${state.provider}`);
  } else {
    console.log('\n  尚未启用任何供应商');
  }

  console.log();
}

/**
 * 启用新供应商
 */
async function handleEnable(agent: AgentDefinition): Promise<void> {
  const keys = await getProviderKeys();

  // 过滤 API 类型兼容且已配置 API Key 的供应商
  const compatible = builtinProviders.filter(
    (p) => p.apiType === agent.apiType && keys[p.name],
  );

  if (compatible.length === 0) {
    console.log(`\n  ❌ 没有已配置 API Key 且兼容 ${agent.apiType} 的供应商\n`);
    console.log(`  请先通过「配置供应商」菜单配置 API Key\n`);
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

  // 逐槽位选择模型
  const modelAssignments = await selectModels(agent, provider);
  if (!modelAssignments) return;

  // 确认
  const yes = await confirm({ message: '确认启用？' });
  if (isCancel(yes) || !yes) return;

  // 保存
  const enabledState = await getEnabledState();
  enabledState[agent.name] = { provider: provider.name, modelAssignments };
  await setEnabledState(enabledState);

  console.log(`\n  ✅ 已为 ${agent.displayName} 启用 ${provider.displayName}\n`);
}

/**
 * 切换供应商
 */
async function handleSwitch(agent: AgentDefinition): Promise<void> {
  const keys = await getProviderKeys();

  // 所有兼容且有 API Key 的供应商（排除当前已启用的）
  const enabledState = await getEnabledState();
  const currentProvider = enabledState[agent.name]?.provider;

  const compatible = builtinProviders.filter(
    (p) => p.apiType === agent.apiType && keys[p.name] && p.name !== currentProvider,
  );

  if (compatible.length === 0) {
    console.log('\n  ❌ 没有其他可切换的供应商\n');
    return;
  }

  const providerName = await select({
    message: '切换到：',
    options: compatible.map((p) => ({
      value: p.name,
      label: p.displayName,
      hint: `${p.models.length} 个模型`,
    })),
  });

  if (isCancel(providerName)) return;

  const provider = compatible.find((p) => p.name === providerName)!;

  const modelAssignments = await selectModels(agent, provider);
  if (!modelAssignments) return;

  const yes = await confirm({ message: '确认切换？' });
  if (isCancel(yes) || !yes) return;

  enabledState[agent.name] = { provider: provider.name, modelAssignments };
  await setEnabledState(enabledState);

  console.log(`\n  ✅ 已切换到 ${provider.displayName}\n`);
}

/**
 * 禁用当前供应商
 */
async function handleDisable(agent: AgentDefinition): Promise<void> {
  const enabledState = await getEnabledState();
  const state = enabledState[agent.name];

  if (!state) {
    console.log('\n  ℹ️  当前没有启用任何供应商\n');
    return;
  }

  const yes = await confirm({
    message: `确认禁用 ${state.provider}？`,
  });

  if (isCancel(yes) || !yes) return;

  delete enabledState[agent.name];
  await setEnabledState(enabledState);

  console.log(`\n  ✅ 已禁用 ${state.provider}\n`);
}

/**
 * 交互式模型选择（公共逻辑）
 */
async function selectModels(
  agent: AgentDefinition,
  provider: { name: string; displayName: string; models: { name: string; description: string }[] },
): Promise<Record<string, string> | null> {
  const modelOptions = provider.models.map((m) => ({
    label: m.name,
    value: m.name,
    hint: m.description,
  }));

  const modelAssignments: Record<string, string> = {};

  for (const slot of agent.models) {
    const selected = await select({
      message: `${slot.description} (${slot.slot})`,
      options: modelOptions,
    });

    if (isCancel(selected)) return null;

    modelAssignments[slot.slot] = selected;
  }

  return modelAssignments;
}
