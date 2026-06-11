import { confirm, isCancel, select } from '@clack/prompts';
import { getEnabledState, setEnabledState } from '../config';
import { expandHome, getConfigPath, isCommandAvailable } from '../utils';
import type { AgentDefinition, Provider } from '../types';
import { detectInstalledAgents } from "../agents/detect";
import { builtinAgents } from "../agents/builtin";
import { providerTemplates } from "../providers/template";

/**
 * 配置智能体子流程
 */
export async function openAgentMenu(): Promise<void> {
  const installedAgents = await detectInstalledAgents();

  // 列出所有 agent，标注安装状态
  const agentOptions = await Promise.all(
    installedAgents.map((a) => ({
      value: a.name,
      label: `${a.displayName}`,
    }))
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
        { value: 'view', label: '查看当前设置' },
        { value: 'selectProvider', label: '设置模型供应商' },
        { value: 'selectModel', label: '设置模型' },
        { value: '__back__', label: '↩ 返回', hint: '' },
      ],
    });

    if (isCancel(action) || action === '__back__') return;

    switch (action) {
      case 'view':
        await handleView(agent);
        break;
      case 'selectProvider':
        await handleSelectProvider(agent);
        break;
      case 'selectModel':
        await handleSelectProvider(agent);
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
  console.log(`  安装状态: ${installed ? '已安装 ✅' : '未安装 ❌'}`);
  console.log(`  配置文件: ${configPath}`);
  console.log(`  API 类型: ${agent.apiType}`);

  if (agent.models.length > 0) {
    console.log('\n  模型:');
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
 * 切换供应商
 */
async function handleSelectProvider(agent: AgentDefinition): Promise<void> {
  const keys: Record<string, Provider> = {};

  // 所有兼容且有 API Key 的供应商（排除当前已启用的）
  const enabledState = await getEnabledState();
  const currentProvider = enabledState[agent.name]?.provider;

  const compatible = providerTemplates.filter(
    (p) => p.apiType === agent.apiType && keys[p.id] && p.id !== currentProvider,
  );

  const providerName = await select({
    message: '切换到：',
    options: compatible.map((p) => ({
      value: p.id,
      label: p.name,
      hint: `${p.models.length} 个模型`,
    })),
  });

  if (isCancel(providerName)) return;

  const provider = compatible.find((p) => p.id === providerName)!;

  const modelAssignments = await selectModels(agent, provider);
  if (!modelAssignments) return;

  const yes = await confirm({ message: '确认切换？' });
  if (isCancel(yes) || !yes) return;

  enabledState[agent.name] = { provider: provider.id, modelAssignments };
  await setEnabledState(enabledState);

  console.log(`\n  ✅ 已切换到 ${provider.name}\n`);
}

/**
 * 交互式模型选择（公共逻辑）
 */
async function selectModels(
  agent: AgentDefinition,
  provider: { name: string; models: { name: string; description: string }[] },
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
