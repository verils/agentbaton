import { randomUUID } from 'node:crypto';
import { isCancel, password, select } from '@clack/prompts';
import { loadConfig, saveConfig } from '../config';
import { backOption } from "./back";
import { findProviderPreset, providerPresets } from "../provider/presets";
import { Config } from "../types";

/**
 * 进入模型供应商设置菜单
 */
export async function openProviderMenu(): Promise<void> {
  const config = await loadConfig();
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

  if (isCancel(providerChoice) || providerChoice === 'back') {
    return;
  }

  switch (providerChoice) {
    case 'addProvider':
      await handleAddProvider()
      return;
    default:
      await handleModifyProvider(providerChoice, config);
      break;
  }
}

async function handleAddProvider() {
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

  if (isCancel(choice) || choice === 'back') {
    return;
  }

  switch (choice) {
    case 'custom':
      await handleAddCustomProvider();
      break;
    default:
      await handleAddTemplateProvider(choice)
      return;
  }
}

async function handleAddTemplateProvider(providerPresetId: string) {
  const providerPreset = findProviderPreset(providerPresetId);
  const apiKey = await password({
    message: `输入 ${providerPreset.name} 的 API Key`,
    mask: '*',
  });

  if (isCancel(apiKey)) {
    return;
  }

  await addProvider(providerPreset.id, apiKey);
  console.log(`\n  ✅ 已保存 ${providerPreset.name} 的 API Key\n`);
}

async function handleAddCustomProvider() {

}

async function handleModifyProvider(providerId: string, config: Config) {
  const provider = config.providers.find(p => p.id === providerId) !!;

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

    if (isCancel(action) || action === 'back') {
      return;
    }

    switch (action) {
      case 'setModels':
        break;
      case 'setApiKey':
        break;
      case 'cleanApiKey':
        break;
      case 'deleteProvider':
        break;
    }
  }
}

async function addProvider(providerPresetId: string, apiKey: string) {
  const config = await loadConfig();
  const preset = findProviderPreset(providerPresetId);

  const endpoints: Config['providers'][number]['endpoints'] = preset.endpoints
    ? Object.values(preset.endpoints).map((e) => ({ type: e.apiType, baseUrl: e.baseUrl }))
    : preset.apiType && preset.baseUrl
      ? [{ type: preset.apiType, baseUrl: preset.baseUrl }]
      : [];

  const models: Config['providers'][number]['models'] = preset.models.map((m) => ({
    id: m.name,
    name: m.description,
    contextWindowSize: 256000,
  }));

  const existing = config.providers.find((p) => p.name === preset.id);
  if (existing) {
    existing.apiKey = apiKey;
    existing.endpoints = endpoints;
    existing.models = models;
  } else {
    config.providers.push({
      id: randomUUID(),
      name: preset.name,
      apiKey,
      endpoints,
      models,
    });
  }

  await saveConfig(config);
}
