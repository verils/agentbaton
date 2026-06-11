import { randomUUID } from 'node:crypto';
import { isCancel, password, select } from '@clack/prompts';
import { loadConfig, saveConfig } from '../config';
import { backOption } from "./back";
import { findProviderTemplate, providerTemplates } from "../providers/template";
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
  const type = await select({
    message: '选择模型供应商类型',
    options: [
      { value: 'template', label: '从模板添加' },
      { value: 'custom', label: '自定义' },
      backOption,
    ]
  });

  if (isCancel(type) || type === 'back') {
    return;
  }

  switch (type) {
    case 'template':
      await handleAddTemplateProvider()
      return;
    default:
      await handleAddCustomProvider();
      break;
  }
}

async function handleAddTemplateProvider() {
  const providerOptions = providerTemplates.map(p => ({
    value: p.id,
    label: p.name
  }));

  const choice = await select({
    message: '选择模型供应商',
    options: [
      ...providerOptions,
      backOption,
    ]
  });

  if (isCancel(choice) || choice === 'back') {
    return;
  }

  const providerTemplate = findProviderTemplate(choice);
  const apiKey = await password({
    message: `输入 ${providerTemplate.name} 的 API Key`,
    mask: '*',
  });

  if (isCancel(apiKey)) {
    return;
  }

  await addProvider(providerTemplate.id, apiKey);
  console.log(`\n  ✅ 已保存 ${providerTemplate.name} 的 API Key\n`);
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

async function addProvider(providerTemplateId: string, apiKey: string) {
  const config = await loadConfig();
  const template = findProviderTemplate(providerTemplateId);

  const endpoints: Config['providers'][number]['endpoints'] = template.endpoints
    ? Object.values(template.endpoints).map((e) => ({ type: e.apiType, baseUrl: e.baseUrl }))
    : template.apiType && template.baseUrl
      ? [{ type: template.apiType, baseUrl: template.baseUrl }]
      : [];

  const models: Config['providers'][number]['models'] = template.models.map((m) => ({
    id: m.name,
    name: m.description,
    contextWindowSize: 0,
  }));

  const existing = config.providers.find((p) => p.name === template.id);
  if (existing) {
    existing.apiKey = apiKey;
    existing.endpoints = endpoints;
    existing.models = models;
  } else {
    config.providers.push({
      id: randomUUID(),
      name: template.name,
      apiKey,
      endpoints,
      models,
    });
  }

  config.providerKeys[template.id] = apiKey;
  await saveConfig(config);
}
