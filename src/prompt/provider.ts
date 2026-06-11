import { isCancel, password, select } from '@clack/prompts';
import { builtinProviders } from '../providers';
import { getProviderKeys, setProviderKey, deleteProviderKey } from '../config';
import { ProviderDefinition } from "../types";

export async function runProviderPrompt(): Promise<void> {
  // 列出所有供应商，标注 API Key 状态
  const keys = await getProviderKeys();

  const providerOptions = builtinProviders.map((p) => ({
    value: p.name,
    label: `${p.displayName}（${keys[p.name] ? '已设置 ✅' : '未设置 ❌'}）`,
  }));

  const providerName = await select({
    message: '选择供应商：',
    options: [
      ...providerOptions,
      { value: '__back__', label: '↩ 返回', hint: '' }
    ],
  });

  if (isCancel(providerName) || providerName === '__back__') {
    return;
  }

  const provider = builtinProviders.find((p) => p.name === providerName)!;
  const key = keys[provider.name];

  // 操作子菜单循环
  while (true) {
    const action = await select({
      message: `${provider.displayName}：`,
      options: [
        { value: 'setApiKey', label: `设置 API Key${key ? `（✅ ${key.slice(0, 6)}...${key.slice(-4)}）` : ''}` },
        { value: 'cleanApiKey', label: `清空 API Key` },
        { value: '__back__', label: '↩ 返回', hint: '' },
      ],
    });

    if (isCancel(action) || action === '__back__') return;

    switch (action) {
      case 'setApiKey':
        await handleSetApiKey(provider);
        break;
      case 'cleanApiKey':
        await handleCleanApiKey(provider);
        break;
    }
  }
}

/**
 * 配置 API Key
 */
async function handleSetApiKey(provider: ProviderDefinition): Promise<void> {
  const key = await password({
    message: `输入 ${provider.displayName} 的 API Key`,
    mask: '*',
  });

  if (isCancel(key)) {
    return;
  }

  await setProviderKey(provider.name, key);
  console.log(`\n  ✅ 已保存 ${provider.displayName} 的 API Key\n`);
}

async function handleCleanApiKey(provider: ProviderDefinition) {
  await deleteProviderKey(provider.name);
  console.log(`\n  🗑️  已清空 ${provider.displayName} 的 API Key\n`);
}
