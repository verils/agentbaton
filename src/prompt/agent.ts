import { confirm, isCancel, log, select, text } from '@clack/prompts';
import { resolvePlatformHome, maskApiKey } from '../utils';
import type { Agent, AgentBatonConfig, AgentNativeConfig, AgentProviderBinding, AgentDefinition, AgentModel } from '../types';
import { detectInstalledAgents } from "../agent/detect";
import { findAgent } from "../agent/builtin";
import { backOption } from "./back";
import { saveConfig } from "../config";
import { handleAddProvider } from "./provider";

/**
 * 配置智能体子流程
 */
export async function openAgentMenu(config: AgentBatonConfig): Promise<void> {
  const installedAgents = await detectInstalledAgents();

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

  if (agent.multiProvider) {
    await openMultiProviderAgentMenu(agent, config);
  } else {
    await openSingleProviderAgentMenu(agent, config);
  }
}

// ─── 多供应商模式 ───

async function openMultiProviderAgentMenu(agent: AgentDefinition, config: AgentBatonConfig): Promise<void> {
  while (true) {
    await displayMultiProviderConfig(agent, config);

    const action = await select({
      message: `${agent.name}：`,
      options: [
        { value: 'add', label: '添加供应商' },
        { value: 'remove', label: '移除供应商' },
        backOption,
      ],
    });

    if (isCancel(action) || action === backOption.value) {
      return;
    }

    switch (action) {
      case 'add':
        await handleAddProviderBinding(agent, config);
        break;
      case 'remove':
        await handleRemoveProviderBinding(agent, config);
        break;
    }
  }
}

async function displayMultiProviderConfig(agent: AgentDefinition, config: AgentBatonConfig): Promise<void> {
  const info: string[] = [];

  const configPath = agent.home
    ? resolvePlatformHome(agent.home)
    : '(未配置)';
  info.push(`配置目录: ${configPath}`);
  info.push(`API 类型: ${agent.apiType}`);

  log.message(info);

  const agentConfig = await agent.loadNativeConfig();
  const bindings = agentConfig?.providers ?? {};
  const entries = Object.entries(bindings);

  // 构建 baseUrl → agentbaton UUID 映射，用于显示名称
  const uuidByBaseUrl = new Map<string, string>();
  for (const provider of config.providers) {
    const endpoint = provider.endpoints.find(e => e.type === agent.apiType);
    if (endpoint) {
      uuidByBaseUrl.set(endpoint.baseUrl, provider.id);
    }
  }

  const lines: string[] = ['已绑定供应商：'];
  if (entries.length === 0) {
    lines.push('  （暂无绑定）');
  } else {
    for (const [key, binding] of entries) {
      // 优先按 UUID 匹配，其次按 baseUrl 匹配
      const uuid = uuidByBaseUrl.get(binding.baseUrl ?? '') ?? key;
      const provider = config.providers.find(p => p.id === uuid);
      const name = provider?.name ?? key;
      const keyDisplay = binding.apiKey ? maskApiKey(binding.apiKey) : '(继承默认)';
      lines.push(`  ${name}  Key: ${keyDisplay}`);
    }
  }
  log.message(lines);
}

async function handleAddProviderBinding(agent: AgentDefinition, config: AgentBatonConfig): Promise<void> {
  // 收集已绑定的 provider ID 和 baseUrl，避免重复添加
  const boundProviderIds = new Set(Object.keys(config.agents[agent.id]?.providers ?? {}));
  const agentConfig = await agent.loadNativeConfig();
  const boundBaseUrls = new Set(
    Object.values(agentConfig?.providers ?? {})
      .map(b => b.baseUrl)
      .filter(Boolean)
  );

  const compatibleProviders = config.providers
    .filter(p => p.endpoints.find(e => e.type === agent.apiType))
    .filter(p => !boundProviderIds.has(p.id))
    .filter(p => {
      const endpoint = p.endpoints.find(e => e.type === agent.apiType);
      return !endpoint || !boundBaseUrls.has(endpoint.baseUrl);
    });

  if (compatibleProviders.length === 0) {
    log.warn(`没有更多可添加的兼容 ${agent.apiType} 类型供应商`);
    const goAdd = await confirm({ message: '是否先去"模型供应商"菜单添加新供应商？' });
    if (isCancel(goAdd) || !goAdd) return;
    await handleAddProvider(config);
    return;
  }

  const providerId = await select({
    message: '选择要绑定的供应商：',
    options: compatibleProviders.map(p => ({
      value: p.id,
      label: p.name,
    })),
  });

  if (isCancel(providerId)) return;

  const provider = compatibleProviders.find(p => p.id === providerId)!;

  const yes = await confirm({ message: `确认绑定 ${provider.name}？` });
  if (isCancel(yes) || !yes) return;

  if (!config.agents[agent.id]) {
    config.agents[agent.id] = { id: agent.id, currentProvider: '', modelSlots: {} };
  }
  const agentEntry = config.agents[agent.id];
  if (!agentEntry.providers) {
    agentEntry.providers = {};
  }
  agentEntry.providers[providerId] = {};

  try {
    await syncMultiProviderNativeConfig(agent, config);
    await saveConfig(config);
    log.success(`✅ ${agent.name} 已绑定 ${provider.name}`);
  } catch (e) {
    delete agentEntry.providers[providerId];
    log.error(`绑定失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

async function handleRemoveProviderBinding(agent: AgentDefinition, config: AgentBatonConfig): Promise<void> {
  const agentEntry = config.agents[agent.id];
  const bindings = agentEntry?.providers;
  if (!bindings || Object.keys(bindings).length === 0) {
    log.warn('当前没有已绑定的供应商');
    return;
  }

  const options = Object.entries(bindings).map(([key, binding]) => {
    const provider = config.providers.find(p => p.id === key);
    const name = provider?.name ?? key;
    const keyDisplay = binding.apiKey ? maskApiKey(binding.apiKey) : '(继承默认)';
    return { value: key, label: `${name}  Key: ${keyDisplay}` };
  });

  const targetId = await select({
    message: '选择要移除的供应商：',
    options: [...options, backOption],
  });

  if (isCancel(targetId) || targetId === backOption.value) return;

  const provider = config.providers.find(p => p.id === targetId);
  const name = provider?.name ?? targetId;

  const yes = await confirm({ message: `确认移除 ${name}？` });
  if (isCancel(yes) || !yes) return;

  const backup = bindings[targetId];
  delete bindings[targetId];

  try {
    await syncMultiProviderNativeConfig(agent, config);
    await saveConfig(config);
    log.success(`✅ ${agent.name} 已移除 ${name}`);
  } catch (e) {
    bindings[targetId] = backup;
    log.error(`移除失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * 将 agentbaton 的 provider 绑定合并到智能体原生配置文件
 */
async function syncMultiProviderNativeConfig(agent: AgentDefinition, config: AgentBatonConfig): Promise<void> {
  const agentEntry = config.agents[agent.id];
  const bindings = agentEntry?.providers ?? {};

  // 读取现有原生配置中的 providers
  const existingConfig = await agent.loadNativeConfig();
  const mergedProviders: Record<string, AgentProviderBinding> = { ...existingConfig?.providers };

  for (const [providerId, binding] of Object.entries(bindings)) {
    const provider = config.providers.find(p => p.id === providerId);
    if (!provider) continue;
    const endpoint = provider.endpoints.find(e => e.type === agent.apiType);
    mergedProviders[providerId] = {
      apiKey: binding.apiKey ?? provider.apiKey,
      baseUrl: binding.baseUrl ?? endpoint?.baseUrl,
    };
  }

  await agent.saveNativeConfig({ providers: mergedProviders });
}

// ─── 单供应商模式 ───

function getCurrentModel(agentConfig: AgentNativeConfig | null, slot: string): string | null {
  return agentConfig?.models?.find((m) => m.slot === slot)?.id ?? null;
}

async function openSingleProviderAgentMenu(agent: AgentDefinition, config: AgentBatonConfig): Promise<void> {
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

/**
 * 查看当前配置（从智能体配置文件读取）
 */
async function displayAgentConfig(agent: AgentDefinition): Promise<void> {
  const info: string[] = [];

  const configPath = agent.home
    ? resolvePlatformHome(agent.home)
    : '(未配置)';
  info.push(`配置目录: ${configPath}`);

  const agentConfig = await agent.loadNativeConfig();
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
    log.warn(`没有兼容 ${agent.apiType} 类型的供应商`);
    const goAdd = await confirm({ message: '是否立即添加？' });
    if (isCancel(goAdd) || !goAdd) return;
    await handleAddProvider(config);
    // 重新检查兼容供应商
    const newCompatible = config.providers
      .filter(p => p.endpoints.find(e => e.type === agent.apiType));
    if (newCompatible.length === 0) return;
    // 更新兼容供应商列表，继续选择流程
    compatibleProviders.length = 0;
    compatibleProviders.push(...newCompatible);
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
    const models: AgentModel[] = Object.entries(configAgent.modelSlots).map(([slot, id]) => ({ slot, id }));
    await agent.saveNativeConfig({
      baseUrl: provider.endpoints.find(e => e.type === agent.apiType)?.baseUrl,
      apiKey: provider.apiKey,
      models,
    });

    await saveConfig(config);
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
    log.warn('尚未设置模型供应商');
    const goSet = await confirm({ message: '是否立即设置？' });
    if (isCancel(goSet) || !goSet) return;
    await handleChooseProvider(agent, config);
    // 重新检查绑定状态
    const updated = config.agents[agent.id];
    if (!updated?.currentProvider) return;
  }

  const provider = config.providers.find(p => p.id === agentAssignment.currentProvider);
  if (!provider) {
    log.error('当前绑定的供应商不存在，请重新设置');
    return;
  }

  const modelOptions = [
    ...provider.models.map((m) => ({
      value: m.id,
      label: m.name,
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
    await agent.saveNativeConfig({
      baseUrl: provider.endpoints.find(e => e.type === agent.apiType)?.baseUrl,
      apiKey: provider.apiKey,
      models: modelAssignments,
    });

    await saveConfig(config);
    log.success(`✅ ${agent.name} 模型已更新`);
  } catch (e) {
    log.error(`保存模型失败：${e instanceof Error ? e.message : String(e)}`);
  }
}
