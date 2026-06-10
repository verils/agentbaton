import { select, password, isCancel } from '@clack/prompts';
import { builtinProviders } from '../builtins/providers/index.js';
import { getProviderKeys, setProviderKey } from '../config/state.js';

/**
 * 配置供应商子流程
 */
export async function runProviderFlow(): Promise<void> {
  // 列出所有供应商，标注 API Key 状态
  const keys = await getProviderKeys();

  const providerOptions = builtinProviders.map((p) => ({
    value: p.name,
    label: p.displayName,
    hint: keys[p.name] ? '✅ 已配置 Key' : '❌ 未配置 Key',
  }));

  const providerName = await select({
    message: '选择供应商：',
    options: [...providerOptions, { value: '__back__', label: '↩ 返回', hint: '' }],
  });

  if (isCancel(providerName) || providerName === '__back__') return;

  const provider = builtinProviders.find((p) => p.name === providerName)!;

  // 操作子菜单循环
  while (true) {
    const currentKeys = await getProviderKeys();
    const hasKey = !!currentKeys[provider.name];

    const action = await select({
      message: `${provider.displayName}：`,
      options: [
        { value: 'models', label: '查看模型列表', hint: `${provider.models.length} 个模型` },
        { value: 'key', label: '配置 API Key', hint: hasKey ? '✅ 已配置' : '❌ 未配置' },
        { value: '__back__', label: '↩ 返回', hint: '' },
      ],
    });

    if (isCancel(action) || action === '__back__') return;

    switch (action) {
      case 'models':
        handleViewModels(provider);
        break;
      case 'key':
        await handleConfigureKey(provider);
        break;
    }
  }
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
