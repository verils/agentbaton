import { randomUUID } from 'node:crypto';
import { confirm, isCancel, log, password, select, text } from '@clack/prompts';
import { saveConfig } from '../config';
import { backOption } from "./back";
import { findProviderPreset, providerPresets } from "../provider/presets";
import { builtinAgents } from "../agent/builtin";
import { AgentBatonConfig, ApiType, Provider } from "../types";

const DEFAULT_CONTEXT_WINDOW = 256000;

/**
 * 进入模型供应商设置菜单
 */
export async function openProviderMenu(config: AgentBatonConfig): Promise<void> {
  const providerOptions = config.providers.map((p) => ({
    value: p.id,
    label: `${p.name}`,
  }));

  const providerChoice = await select({
    message: '选择模型供应商：',
    options: [
      ...providerOptions,
      { value: 'addProvider', label: '添加模型供应商' },
      backOption
    ],
  });

  if (isCancel(providerChoice) || providerChoice === backOption.value) {
    return;
  }

  switch (providerChoice) {
    case 'addProvider':
      await handleAddProvider(config);
      return;
    default:
      await handleModifyProvider(providerChoice, config);
      break;
  }
}

export async function handleAddProvider(config: AgentBatonConfig) {
  const providerPresetOptions = providerPresets.map(p => ({
    value: p.id,
    label: p.name
  }));

  const choice = await select({
    message: '选择模型供应商',
    options: [
      ...providerPresetOptions,
      { value: 'custom', label: '自定义模型供应商' },
      backOption,
    ]
  });

  if (isCancel(choice) || choice === backOption.value) {
    return;
  }

  switch (choice) {
    case 'custom':
      await handleAddCustomProvider(config);
      break;
    default:
      await handleAddPresetProvider(choice, config);
      return;
  }
}

async function handleAddPresetProvider(providerPresetId: string, config: AgentBatonConfig) {
  const providerPreset = findProviderPreset(providerPresetId);

  let pricingId: string | undefined;
  if (providerPreset.pricing && providerPreset.pricing.length > 1) {
    const choice = await select({
      message: `选择 ${providerPreset.name} 的付费模式`,
      options: providerPreset.pricing.map(p => ({
        value: p.id,
        label: p.name,
      })),
    });

    if (isCancel(choice) || choice === 'back') {
      return;
    }
    pricingId = choice as string;
  }

  const apiKey = await password({
    message: `输入 ${providerPreset.name} 的 API Key`,
    mask: '*',
  });

  if (isCancel(apiKey)) {
    return;
  }

  try {
    await addProvider(config, providerPreset.id, apiKey, pricingId);
    log.success(`✅ 已保存 ${providerPreset.name} 的 API Key`);
  } catch (e) {
    log.error(`添加供应商失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

async function handleAddCustomProvider(config: AgentBatonConfig) {
  const name = await text({
    message: '输入供应商名称',
    placeholder: '例如: My Provider',
  });
  if (isCancel(name)) return;

  const apiType = await select({
    message: '选择 API 类型',
    options: [
      { value: 'openai', label: 'OpenAI' },
      { value: 'anthropic', label: 'Anthropic' },
      { value: 'google', label: 'Google' },
    ],
  });
  if (isCancel(apiType)) return;

  const baseUrl = await text({
    message: '输入 Base URL',
    placeholder: '例如: https://api.example.com/v1',
  });
  if (isCancel(baseUrl)) return;

  const apiKey = await password({
    message: '输入 API Key',
    mask: '*',
  });
  if (isCancel(apiKey)) return;

  const newProvider = {
    id: randomUUID(),
    name: name as string,
    apiKey: apiKey as string,
    endpoints: [{ type: apiType as ApiType, baseUrl: baseUrl as string }],
    models: [],
  };

  config.providers.push(newProvider);
  try {
    await saveConfig(config);
    log.success(`✅ 已添加 ${name}`);
  } catch (e) {
    config.providers.pop();
    log.error(`添加失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

async function handleSetProviderApiKey(provider: Provider, config: AgentBatonConfig) {
  const apiKey = await password({
    message: `输入 ${provider.name} 的 API Key`,
    mask: '*',
  });

  if (isCancel(apiKey)) {
    return;
  }

  provider.apiKey = apiKey;
  try {
    await saveConfig(config);
    log.success(`✅ 已保存 ${provider.name} 的 API Key`);
  } catch (e) {
    log.error(`保存失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

export function findProvider(config: AgentBatonConfig, providerId: string) {
  return config.providers.find(p => p.id === providerId) !!;
}

async function handleModifyProvider(providerId: string, config: AgentBatonConfig) {
  const provider = findProvider(config, providerId);

  // 操作子菜单循环
  while (true) {
    // 检查供应商是否被智能体使用
    const isUsed = Object.values(config.agents).some(a => a.currentProvider === provider.id);

    const action = await select({
      message: `设置 ${provider.name}`,
      options: [
        {
          value: 'setModels',
          label: '设置模型'
        },
        {
          value: 'setApiKey',
          label: '设置 API Key'
        },
        {
          value: 'cleanApiKey',
          label: '清除 API Key'
        },
        {
          value: 'deleteProvider',
          label: '删除此模型供应商',
          disabled: isUsed,
          hint: isUsed ? '当前供应商正在被使用' : undefined
        },
        backOption,
      ],
    });

    if (isCancel(action) || action === backOption.value) {
      return;
    }

    switch (action) {
      case 'setModels':
        await handleSetModels(provider, config);
        break;
      case 'setApiKey':
        await handleSetProviderApiKey(provider, config);
        break;
      case 'cleanApiKey':
        await handleCleanApiKey(provider, config);
        break;
      case 'deleteProvider':
        if (await handleDeleteProvider(provider, config)) return;
        break;
    }
  }
}

async function addProvider(config: AgentBatonConfig, providerPresetId: string, apiKey: string, pricingId?: string) {
  const preset = findProviderPreset(providerPresetId);

  const pricing = pricingId
    ? preset.pricing?.find(p => p.id === pricingId)
    : preset.pricing?.find(p => p.id === 'default') ?? preset.pricing?.[0];
  const endpoints: AgentBatonConfig['providers'][number]['endpoints'] = pricing
    ? Object.values(pricing.endpoints).map((e) => ({ type: e.apiType, baseUrl: e.baseUrl }))
    : preset.apiType && preset.baseUrl
      ? [ { type: preset.apiType, baseUrl: preset.baseUrl } ]
      : [];

  const models = (preset.models ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    contextWindowSize: m.contextWindowSize ?? DEFAULT_CONTEXT_WINDOW,
  }));

  const newProvider = {
    id: randomUUID(),
    name: preset.name,
    apiKey,
    endpoints,
    models,
  };

  config.providers.push(newProvider);

  try {
    await saveConfig(config);
  } catch (e) {
    config.providers.pop();
    throw e;
  }
}

async function handleCleanApiKey(provider: Provider, config: AgentBatonConfig) {
  const yes = await confirm({ message: `确认清除 ${provider.name} 的 API Key？` });
  if (isCancel(yes) || !yes) return;

  provider.apiKey = '';
  try {
    await saveConfig(config);
    log.success(`✅ 已清除 ${provider.name} 的 API Key`);
  } catch (e) {
    log.error(`清除失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

async function handleDeleteProvider(provider: Provider, config: AgentBatonConfig): Promise<boolean> {
  const yes = await confirm({ message: `确认删除供应商 ${provider.name}？此操作不可撤销。` });
  if (isCancel(yes) || !yes) return false;

  // 级联清理：清除所有绑定此供应商的 agent 配置
  for (const [agentId, agentAssignment] of Object.entries(config.agents)) {
    if (agentAssignment.currentProvider === provider.id) {
      agentAssignment.currentProvider = '';
      agentAssignment.modelSlots = {};

      const agent = builtinAgents.find(a => a.id === agentId);
      if (agent) {
        try {
          await agent.saveNativeConfig({ baseUrl: undefined, apiKey: undefined, models: [] });
        } catch {
          // 智能体配置文件写入失败不阻塞删除流程
        }
      }
    }
    // 清除 history 中的对应条目
    if (agentAssignment.history) {
      delete agentAssignment.history[provider.id];
    }
  }

  // 从 providers 列表中移除
  const idx = config.providers.findIndex(p => p.id === provider.id);
  if (idx !== -1) config.providers.splice(idx, 1);

  try {
    await saveConfig(config);
    log.success(`✅ 已删除 ${provider.name}`);
    return true;
  } catch (e) {
    // 回滚
    if (idx !== -1) config.providers.splice(idx, 0, provider);
    log.error(`删除失败：${e instanceof Error ? e.message : String(e)}`);
    return false;
  }
}

async function handleSetModels(provider: Provider, config: AgentBatonConfig) {
  const action = await select({
    message: '选择操作',
    options: [
      { value: 'fetch', label: '从 API 获取模型列表' },
      { value: 'add', label: '手动添加模型' },
      { value: 'clear', label: '清空模型列表' },
      backOption,
    ],
  });

  if (isCancel(action) || action === backOption.value) return;

  switch (action) {
    case 'fetch': {
      const preset = providerPresets.find(p => p.name === provider.name);
      if (!preset?.fetchModels) {
        log.warn('此供应商不支持从 API 获取模型列表');
        return;
      }

      const endpoint = provider.endpoints[0];
      if (!endpoint) {
        log.error('供应商缺少 API 端点');
        return;
      }

      log.info('正在获取模型列表...');
      try {
        const models = await preset.fetchModels(endpoint.type, endpoint.baseUrl, provider.apiKey);
        provider.models = models.map(m => ({
          id: m.id,
          name: m.name,
          contextWindowSize: m.contextWindowSize ?? DEFAULT_CONTEXT_WINDOW,
        }));
        await saveConfig(config);
        log.success(`✅ 已获取 ${provider.models.length} 个模型`);
      } catch (e) {
        log.error(`获取模型失败：${e instanceof Error ? e.message : String(e)}`);
      }
      break;
    }
    case 'add': {
      const modelId = await text({
        message: '输入模型 ID',
        placeholder: '例如: gpt-4o',
      });
      if (isCancel(modelId)) return;

      const modelName = await text({
        message: '输入模型显示名称',
        placeholder: '例如: GPT-4o',
      });
      if (isCancel(modelName)) return;

      provider.models.push({
        id: modelId as string,
        name: modelName as string,
        contextWindowSize: DEFAULT_CONTEXT_WINDOW,
      });

      try {
        await saveConfig(config);
        log.success(`✅ 已添加模型 ${modelName}`);
      } catch (e) {
        provider.models.pop();
        log.error(`添加失败：${e instanceof Error ? e.message : String(e)}`);
      }
      break;
    }
    case 'clear': {
      const yes = await confirm({ message: `确认清空 ${provider.name} 的模型列表？` });
      if (isCancel(yes) || !yes) return;

      const backup = provider.models;
      provider.models = [];
      try {
        await saveConfig(config);
        log.success('✅ 已清空模型列表');
      } catch (e) {
        provider.models = backup;
        log.error(`清空失败：${e instanceof Error ? e.message : String(e)}`);
      }
      break;
    }
  }
}
