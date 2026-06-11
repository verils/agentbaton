import { Command } from 'commander';
import { intro, outro, password, isCancel } from '@clack/prompts';
import { builtinProviders } from '../providers/index';
import { getProviderKeys, setProviderKey } from '../config/state';
import type { ProviderDefinition } from '../types/provider';
import { getStringWidth, padEndWidth } from '../utils';

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

      if (name) {
        const provider = providers.find((p) => p.name === name);
        if (!provider) {
          console.error(`未找到 Provider: ${name}`);
          process.exit(1);
        }

        if (options?.key) {
          // 直接配置 API Key
          await setProviderKey(name, options.key);
          console.log(`\n✅ 已保存 ${provider.displayName} 的 API Key\n`);
        } else {
          // 交互式配置 API Key
          intro(`配置 ${provider.displayName} 的 API Key`);

          const key = await password({
            message: '输入 API Key',
            mask: '*',
          });

          if (isCancel(key)) {
            outro('已取消');
            process.exit(0);
          }

          await setProviderKey(name, key);
          outro('✅ 已保存');
        }
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
  const width = Math.max(...providers.map(p => getStringWidth(p.displayName))) + 4;
  for (const provider of providers) {
    const hasKey = keys[provider.name] ? '✅ 已配置' : '❌ 未配置';
    console.log(`  ${padEndWidth(provider.displayName, width)} ${hasKey}  (${provider.apiType})`);
  }
  console.log();
}
