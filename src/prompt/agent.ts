import { confirm, isCancel, log, select, text } from '@clack/prompts';
import { expandHome, getCurrentPlatformConfigPath, maskApiKey } from '../utils';
import type { Agent, AgentBatonConfig, AgentConfig, AgentDefinition, AgentModel } from '../types';
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

  // 操作子菜单循环
  while (true) {
    await displayAgentConfig(agent);

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
        await handleChooseModel(agent, config);
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

  const configPath = agent.home
    ? expandHome(getCurrentPlatformConfigPath(agent.home))
    : '(未配置)';
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

  if (compatibleProviders.length === 0) {
    log.warn(`没有兼容 ${agent.apiType} 类型的供应商，请先添加模型供应商`);
    return;
  }

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

  const configAgent: Agent = config.agents[agent.id] ?? { id: agent.id, currentProvider: '', modelSlots: {} };

  // 保存当前供应商的模型槽位到 history
  if (configAgent.currentProvider && Object.keys(configAgent.modelSlots).length > 0) {
    if (!configAgent.history) configAgent.history = {};
    configAgent.history[configAgent.currentProvider] = { ...configAgent.modelSlots };
  }

  // 切换到新供应商，尝试恢复历史模型槽位
  configAgent.currentProvider = providerId;
  configAgent.modelSlots = configAgent.history?.[providerId] ? { ...configAgent.history[providerId] } : {};
  config.agents[agent.id] = configAgent;

  try {
    await saveConfig(config);

    const models: AgentModel[] = Object.entries(configAgent.modelSlots).map(([slot, id]) => ({ slot, id }));
    await agent.saveConfig({
      baseUrl: provider.endpoints.find(e => e.type === agent.apiType)?.baseUrl,
      apiKey: provider.apiKey,
      models,
    });
    log.success(`✅ ${agent.name} 已切换到 ${provider.name}`);

    // 恢复的槽位为空且有模型槽位定义时，提示用户配置模型
    if (Object.keys(configAgent.modelSlots).length === 0 && agent.models.length > 0) {
      const configure = await confirm({ message: '当前供应商尚未配置模型，是否立即设置？' });
      if (!isCancel(configure) && configure) {
        await handleChooseModel(agent, config);
      }
    }
  } catch (e) {
    log.error(`切换失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

async function handleChooseModel(agent: AgentDefinition, config: AgentBatonConfig): Promise<void> {
  const agentAssignment = config.agents[agent.id];
  if (!agentAssignment?.currentProvider) {
    log.warn('请先设置模型供应商');
    return;
  }

  const provider = config.providers.find(p => p.id === agentAssignment.currentProvider);
  if (!provider) {
    log.error('当前绑定的供应商不存在，请重新设置');
    return;
  }

  const modelOptions = [
    ...provider.models.map((m) => ({
      label: m.name,
      value: m.id,
    })),
    { label: '手动输入', value: '__manual__' },
  ];

  const modelAssignments: AgentModel[] = [];

  for (const slot of agent.models) {
    const selected = await select({
      message: `${slot.name} (${slot.slot})`,
      options: modelOptions,
    });

    if (isCancel(selected)) return;

    let modelId = selected as string;
    if (modelId === '__manual__') {
      const manual = await text({
        message: `输入 ${slot.name} 的模型 ID`,
        placeholder: '例如: gpt-4o',
      });
      if (isCancel(manual)) return;
      modelId = manual as string;
    }

    modelAssignments.push({ slot: slot.slot, id: modelId });
  }

  agentAssignment.modelSlots = Object.fromEntries(modelAssignments.map(m => [m.slot, m.id]));

  try {
    await saveConfig(config);
    await agent.saveConfig({
      baseUrl: provider.endpoints.find(e => e.type === agent.apiType)?.baseUrl,
      apiKey: provider.apiKey,
      models: modelAssignments,
    });
    log.success(`✅ ${agent.name} 模型已更新`);
  } catch (e) {
    log.error(`保存模型失败：${e instanceof Error ? e.message : String(e)}`);
  }
}
