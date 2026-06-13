import { randomUUID } from 'node:crypto';
import { isCancel, log, password, select } from '@clack/prompts';
import { saveConfig } from '../config';
import { backOption } from "./back";
import { findProviderPreset, providerPresets } from "../provider/presets";
import { AgentBatonConfig, Provider } from "../types";

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

async function handleAddProvider(config: AgentBatonConfig) {
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

async function handleAddCustomProvider(_config: AgentBatonConfig) {

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
          label: '删除此模型供应商'
        },
        backOption,
      ],
    });

    if (isCancel(action) || action === backOption.value) {
      return;
    }

    switch (action) {
      case 'setModels':
        break;
      case 'setApiKey':
        await handleSetProviderApiKey(provider, config);
        break;
      case 'cleanApiKey':
        break;
      case 'deleteProvider':
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

  const models: AgentBatonConfig['providers'][number]['models'] = (preset.models ?? []).map((m) => ({
    id: m.name,
    name: m.description!,
    contextWindowSize: DEFAULT_CONTEXT_WINDOW,
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
