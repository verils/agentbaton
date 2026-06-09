import { Command } from 'commander';
import { builtinAgents } from '../builtins/agents/index.js';
import { builtinProviders } from '../builtins/providers/index.js';
import { getProviderKeys, getEnabledState, setEnabledState } from '../config/state.js';
import type { AgentDefinition } from '../types/agent.js';
import type { ProviderDefinition } from '../types/provider.js';

/**
 * 创建 enable 命令
 */
export function createEnableCommand(): Command {
  const cmd = new Command('enable')
    .description('为智能体启用 Provider')
    .argument('<agent>', '智能体名称')
    .argument('<provider>', 'Provider 名称')
    .action(async (agentName: string, providerName: string) => {
      const agent = builtinAgents.find((a) => a.name === agentName);
      if (!agent) {
        console.error(`未找到智能体: ${agentName}`);
        process.exit(1);
      }

      const provider = builtinProviders.find((p) => p.name === providerName);
      if (!provider) {
        console.error(`未找到 Provider: ${providerName}`);
        process.exit(1);
      }

      // 检查 API 类型兼容性
      if (agent.apiType !== provider.apiType) {
        console.error(
          `\n❌ API 类型不兼容: ${agent.displayName} (${agent.apiType}) 与 ${provider.displayName} (${provider.apiType})\n`,
        );
        process.exit(1);
      }

      // 检查 API Key
      const keys = await getProviderKeys();
      if (!keys[provider.name]) {
        console.error(`\n❌ 请先配置 ${provider.displayName} 的 API Key:`);
        console.error(`   agentbaton provider ${provider.name} --key <your-key>\n`);
        process.exit(1);
      }

      // TODO: 交互式模型选择
      console.log(`\n${agent.displayName} 需要配置以下模型:\n`);
      const modelAssignments: Record<string, string> = {};

      for (const slot of agent.models) {
        // 默认选择第一个模型
        const defaultModel = provider.models[0];
        modelAssignments[slot.slot] = defaultModel.name;
        console.log(`  ${slot.slot.padEnd(12)} ${slot.description.padEnd(20)} → ${defaultModel.name}`);
      }

      console.log('\n✅ 已启用\n');

      // 保存启用状态
      const enabledState = await getEnabledState();
      enabledState[agent.name] = {
        provider: provider.name,
        modelAssignments,
      };
      await setEnabledState(enabledState);
    });

  return cmd;
}
