import { Command } from 'commander';
import { builtinProviders } from '../builtins/providers/index.js';
import { getProviderKeys, setProviderKey } from '../config/state.js';
import type { ProviderDefinition } from '../types/provider.js';

/**
 * 加载所有 provider 定义（内置 + 用户自定义）
 */
async function loadProviders(): Promise<ProviderDefinition[]> {
  // TODO: 加载用户自定义 provider 定义
  return builtinProviders;
}

/**
 * 创建 provider 命令
 */
export function createProviderCommand(): Command {
  const cmd = new Command('provider')
    .description('Provider 管理')
    .argument('[name]', 'Provider 名称')
    .option('--key <key>', '配置 API Key')
    .action(async (name?: string, options?: { key?: string }) => {
      const providers = await loadProviders();

      if (name && options?.key) {
        // 配置 API Key
        const provider = providers.find((p) => p.name === name);
        if (!provider) {
          console.error(`未找到 Provider: ${name}`);
          process.exit(1);
        }
        await setProviderKey(name, options.key);
        console.log(`\n✅ 已保存 ${provider.displayName} 的 API Key\n`);
        return;
      }

      if (name) {
        // 显示单个 provider 详情
        const provider = providers.find((p) => p.name === name);
        if (!provider) {
          console.error(`未找到 Provider: ${name}`);
          process.exit(1);
        }
        await displayProviderDetail(provider);
      } else {
        // 列出所有 providers
        await displayProviderList(providers);
      }
    });

  return cmd;
}

async function displayProviderList(providers: ProviderDefinition[]): Promise<void> {
  const keys = await getProviderKeys();

  console.log('\n可用的 Provider:\n');
  for (const provider of providers) {
    const hasKey = keys[provider.name] ? '✅ 已配置' : '❌ 未配置';
    console.log(`  ${provider.displayName.padEnd(20)} ${hasKey}  (${provider.apiType})`);
  }
  console.log();
}

async function displayProviderDetail(provider: ProviderDefinition): Promise<void> {
  const keys = await getProviderKeys();
  const hasKey = !!keys[provider.name];

  console.log(`\n${provider.displayName}`);
  console.log('─'.repeat(40));
  console.log(`  名称:     ${provider.name}`);
  console.log(`  API 类型: ${provider.apiType}`);
  console.log(`  Base URL: ${provider.baseUrl}`);
  console.log(`  API Key:  ${hasKey ? '✅ 已配置' : '❌ 未配置'}`);
  console.log();

  if (provider.models.length > 0) {
    console.log('  可用模型:');
    for (const model of provider.models) {
      console.log(`    ${model.name.padEnd(24)} ${model.description}`);
    }
  }

  console.log();
}
