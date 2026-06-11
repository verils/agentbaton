import { Command } from 'commander';
import { intro, outro, select, confirm, isCancel } from '@clack/prompts';
import { getProviderKeys, getEnabledState, setEnabledState } from '../config/state';
import { builtinAgents } from "../agents/builtin";
import { providerTemplates } from "../providers/template";

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

      const provider = providerTemplates.find((p) => p.id === providerName);
      if (!provider) {
        console.error(`未找到 Provider: ${providerName}`);
        process.exit(1);
      }

      // 检查 API 类型兼容性
      if (agent.apiType !== provider.apiType) {
        console.error(
          `\n❌ API 类型不兼容: ${agent.displayName} (${agent.apiType}) 与 ${provider.name} (${provider.apiType})\n`,
        );
        process.exit(1);
      }

      // 检查 API Key
      const keys = await getProviderKeys();
      if (!keys[provider.id]) {
        console.error(`\n❌ 请先配置 ${provider.name} 的 API Key:`);
        console.error(`   agentbaton provider ${provider.id} --key <your-key>\n`);
        process.exit(1);
      }

      // 交互式模型选择
      intro(`为 ${agent.displayName} 启用 ${provider.name}`);

      const modelAssignments: Record<string, string> = {};
      const modelOptions = provider.models.map((m) => ({
        label: m.name,
        value: m.name,
        hint: m.description,
      }));

      for (const slot of agent.models) {
        const selected = await select({
          message: `${slot.description} (${slot.slot})`,
          options: modelOptions,
        });

        if (isCancel(selected)) {
          outro('已取消');
          process.exit(0);
        }

        modelAssignments[slot.slot] = selected;
      }

      // 确认
      const yes = await confirm({
        message: '确认启用？',
      });

      if (isCancel(yes) || !yes) {
        outro('已取消');
        process.exit(0);
      }

      // 保存启用状态
      const enabledState = await getEnabledState();
      enabledState[agent.name] = {
        provider: provider.id,
        modelAssignments,
      };
      await setEnabledState(enabledState);

      outro('✅ 已启用');
    });

  return cmd;
}
