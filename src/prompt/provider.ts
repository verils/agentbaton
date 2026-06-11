import { isCancel, password, select } from '@clack/prompts';
import { builtinProviders } from '../providers';
import { getProviderKeys, setProviderKey } from '../config';

export async function runProviderPrompt(): Promise<void> {
  // 列出所有供应商，标注 API Key 状态
  const keys = await getProviderKeys();

  const providerOptions = builtinProviders.map((p) => ({
    value: p.name,
    label: `${p.displayName}（${keys[p.name] ? '✅ 已设置' : '❌ 未设置'}）`,
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
        { value: 'apikey', label: `设置 API Key${key ? `（✅ ${key.slice(0, 6)}...${key.slice(-4)}）` : ''}` },
        { value: 'model', label: `设置模型` },
        { value: '__back__', label: '↩ 返回', hint: '' },
      ],
    });

    if (isCancel(action) || action === '__back__') return;

    switch (action) {
      case 'apikey':
        await handleConfigureKey(provider);
        break;
      case 'model':
        handleViewModels(provider);
        break;
    }
  }
}

/**
 * 配置 API Key
 */
async function handleConfigureKey(provider: { name: string; displayName: string }): Promise<void> {
  const key = await password({
    message: `输入 ${provider.displayName} 的 API Key`,
    mask: '*',
  });

  if (isCancel(key)) return;

  await setProviderKey(provider.name, key);
  console.log(`\n  ✅ 已保存 ${provider.displayName} 的 API Key\n`);
}

/**
 * 查看模型列表
 */
function handleViewModels(provider: { displayName: string; models: { name: string; description: string }[] }): void {
  console.log(`\n  ${provider.displayName} 可用模型`);
  console.log(`  ${'─'.repeat(40)}`);
  for (const model of provider.models) {
    console.log(`  • ${model.name}  —  ${model.description}`);
  }
  console.log();
}
