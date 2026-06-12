import { confirm, isCancel, log, select } from '@clack/prompts';
import { getEnabledState, setEnabledState } from '../config';
import { expandHome, getConfigPath, maskApiKey } from '../utils';
import type { AgentConfig, AgentDefinition, Provider } from '../types';
import { providerPresets } from "../provider/presets";
import { detectInstalledAgents } from "../agent/detect";
import { builtinAgents } from "../agent/builtin";
import { backOption } from "./back";

/**
 * 配置智能体子流程
 */
export async function openAgentMenu(): Promise<void> {
  const installedAgents = await detectInstalledAgents();

  // 列出所有 agent，标注安装状态
  const agentOptions = await Promise.all(
    installedAgents.map((a) => ({
      value: a.id,
      label: `${a.name}`,
    }))
  );

  const agentId = await select({
    message: '选择智能体：',
    options: [ ...agentOptions, backOption ],
  });

  if (isCancel(agentId) || agentId === backOption.value) {
    return;
  }

  const agent = builtinAgents.find((a) => a.id === agentId)!;

  await displayAgentConfig(agent);

  // 操作子菜单循环
  while (true) {
    const action = await select({
      message: `${agent.name}：`,
      options: [
        { value: 'chooseProvider', label: '设置模型供应商' },
        { value: 'chooseModel', label: '设置模型' },
        backOption,
      ],
    });

    if (isCancel(action) || action === backOption.value) {
      return;
    }

    switch (action) {
      case 'chooseProvider':
        await handleChooseProvider(agent);
        break;
      case 'chooseModel':
        await handleChooseProvider(agent);
        break;
    }
  }
}

function getCurrentModel(agentConfig: AgentConfig | null, slot: string): string | null {
  return agentConfig?.models?.find((m) => m.slot === slot)?.id ?? null;
}

/**
 * 查看当前配置（从智能体配置文件读取）
 */
async function displayAgentConfig(agent: AgentDefinition): Promise<void> {
  const info: string[] = [];

  const configPath = expandHome(getConfigPath(agent.configPaths));
  info.push(`配置文件: ${configPath}`);
  info.push(`API 类型: ${agent.apiType}`);

  const agentConfig = await agent.parseConfig();
  if (agentConfig?.baseUrl) {
    info.push(`接口地址: ${agentConfig.baseUrl}`);
  }
  if (agentConfig?.apiKey) {
    info.push(`API Key: ${maskApiKey(agentConfig.apiKey)}`);
  }

  info.push(`\n模型：`);
  for (const slot of agent.models) {
    const modelId = getCurrentModel(agentConfig, slot.slot);
    info.push(`${slot.name}：${(modelId ? `${modelId}` : '（获取失败）')}`);
  }

  log.message(info);
}

/**
 * 切换供应商
 */
async function handleChooseProvider(agent: AgentDefinition): Promise<void> {
  const keys: Record<string, Provider> = {};

  // 所有兼容且有 API Key 的供应商（排除当前已启用的）
  const enabledState = await getEnabledState();
  const currentProvider = enabledState[agent.id]?.provider;

  const compatible = providerPresets.filter(
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

  const modelAssignments = await selectModels(agent, provider as {
    name: string;
    models: { name: string; description: string }[]
  });
  if (!modelAssignments) return;

  const yes = await confirm({ message: '确认切换？' });
  if (isCancel(yes) || !yes) return;

  enabledState[agent.id] = { provider: provider.id, modelAssignments };
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
