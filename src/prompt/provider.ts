import { isCancel, password, select } from '@clack/prompts';
import { loadConfig } from '../config';
import { backOption } from "./back";
import { providerTemplates } from "../providers/template";
import { Config } from "../types";
import { findProviderTemplate } from "../providers/template";

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
    message: '选择供应商：',
    options: [
      ...providerOptions,
      { value: 'addCustomProvider', label: '添加模型供应商' },
      backOption
    ],
  });

  if (isCancel(providerChoice) || providerChoice === 'back') {
    return;
  }

  switch (providerChoice) {
    case 'addCustomProvider':
      await handleAddCustomProvider()
      return;
    default:
      await handleAddProvider(providerChoice, config);
      break;
  }
}

async function handleAddProvider(providerTemplateId: string, config: Config) {
  const provider = providerTemplates.find((p) => p.id === providerTemplateId)!;

  const providerTemplate = findProviderTemplate(providerTemplateId);
  const apiKey = await password({
    message: `输入 ${providerTemplate.name} 的 API Key`,
    mask: '*',
  });

  if (isCancel(apiKey)) {
    return;
  }

  await addProvider(providerTemplate.id, apiKey);
  console.log(`\n  ✅ 已保存 ${providerTemplate.name} 的 API Key\n`);

  // 操作子菜单循环
  while (true) {
    const action = await select({
      message: `${provider.name}：`,
      options: [
        {
          value: 'setApiKey',
          label: '设置 API Key'
        },
        {
          value: 'cleanApiKey',
          label: '清除 API Key'
        },
        backOption,
      ],
    });

    if (isCancel(action) || action === 'back') {
      return;
    }

    switch (action) {
      case 'setApiKey':
        break;
      case 'cleanApiKey':
        break;
    }
  }
}

async function handleAddCustomProvider() {
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

async function addProvider(providerTemplateId: string, apiKey: string) {
  // TODO
}
