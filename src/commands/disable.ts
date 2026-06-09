import { Command } from 'commander';
import { getEnabledState, setEnabledState } from '../config/state.js';

/**
 * 创建 disable 命令
 */
export function createDisableCommand(): Command {
  const cmd = new Command('disable')
    .description('禁用智能体的 Provider')
    .argument('<agent>', '智能体名称')
    .argument('<provider>', 'Provider 名称')
    .action(async (agentName: string, providerName: string) => {
      const enabledState = await getEnabledState();
      const state = enabledState[agentName];

      if (!state || state.provider !== providerName) {
        console.error(`\n❌ ${agentName} 未启用 ${providerName}\n`);
        process.exit(1);
      }

      delete enabledState[agentName];
      await setEnabledState(enabledState);

      console.log(`\n✅ 已禁用 ${agentName} 的 ${providerName}\n`);
    });

  return cmd;
}
