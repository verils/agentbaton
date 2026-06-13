import { confirm, isCancel, log, select } from '@clack/prompts';
import { expandHome, getCurrentPlatformConfigPath, maskApiKey } from '../utils';
import type { Agent, AgentBatonConfig, AgentConfig, AgentDefinition } from '../types';
import { detectInstalledAgents } from "../agent/detect";
import { findAgent } from "../agent/builtin";
import { backOption } from "./back";
import { saveConfig } from "../config";

/**
 * 配置智能体子流程
 */
export async function openAgentMenu(config: AgentBatonConfig): Promise<void> {
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

  const agent = findAgent(agentId)!;

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
        await handleChooseProvider(agent, config);
        break;
      case 'chooseModel':
        await handleChooseModel(agent);
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

  const configPath = expandHome(getCurrentPlatformConfigPath(agent.home ?? agent.configPaths!!));
  info.push(`配置目录: ${configPath}`);

  const agentConfig = await agent.parseConfig();
  if (agentConfig?.baseUrl) {
    info.push(`接口地址: ${agentConfig.baseUrl}`);
  }

  info.push(`API 类型: ${agent.apiType}`);

  if (agentConfig?.apiKey) {
    info.push(`API Key: ${maskApiKey(agentConfig.apiKey)}`);
  }

  log.message(info);


  const models: string[] = [`模型：`];
  for (const slot of agent.models) {
    const modelId = getCurrentModel(agentConfig, slot.slot);
    models.push(`${slot.name}：${(modelId ? `${modelId}` : '（获取失败）')}`);
  }
  log.message(models);
}

/**
 * 切换供应商
 */
async function handleChooseProvider(agent: AgentDefinition, config: AgentBatonConfig): Promise<void> {
  const compatibleProviders = config.providers
    .filter(p => p.endpoints.find(e => e.type === agent.apiType));

  const providerId = await select({
    message: '切换到：',
    options: compatibleProviders.map((p) => ({
      value: p.id,
      label: p.name,
    })),
  });

  if (isCancel(providerId)) {
    return;
  }

  const provider = compatibleProviders.find((p) => p.id === providerId)!;

  const yes = await confirm({ message: '确认切换？' });
  if (isCancel(yes) || !yes) {
    return;
  }

  const configAgent: Agent = config.agents[agent.id] ?? { id: agent.id };
  configAgent.currentProvider = providerId;
  await saveConfig(config)

  agent.saveConfig({
    baseUrl: provider.endpoints.find(e => e.type === agent.apiType)?.baseUrl,
    apiKey: provider.apiKey,
  });

  log.success(`✅ 已切换到 ${provider.name}`);
}

async function handleChooseModel(agent: AgentDefinition) {

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
