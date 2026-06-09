import { intro, outro, select, confirm, isCancel, group } from '@clack/prompts';
import { existsSync } from 'node:fs';
import { builtinAgents } from '../builtins/agents/index.js';
import { builtinProviders } from '../builtins/providers/index.js';
import { getProviderKeys, getEnabledState, setEnabledState } from '../config/state.js';
import { expandHome } from '../utils/path.js';

/**
 * 交互式配置流程
 */
export async function runInteractive(): Promise<void> {
  intro('Agent Baton — 智能体配置管理');

  // 筛选已安装的 agent
  const installedAgents = builtinAgents.filter((a) => existsSync(expandHome(a.configPath)));

  if (installedAgents.length === 0) {
    outro('❌ 未检测到已安装的智能体');
    process.exit(0);
  }

  const keys = await getProviderKeys();
  const configuredProviders = builtinProviders.filter((p) => keys[p.name]);

  if (configuredProviders.length === 0) {
    outro('❌ 未配置任何 Provider 的 API Key');
    console.log('\n请先配置 Provider:');
    console.log('  agentbaton provider <name> --key <your-key>\n');
    process.exit(0);
  }

  try {
    const result = await group(
      {
        agent: () =>
          select({
            message: '选择智能体',
            options: installedAgents.map((a) => ({
              label: a.displayName,
              value: a.name,
              hint: a.apiType,
            })),
          }),
        provider: ({ results }) => {
          // 根据选中的 agent 筛选兼容的 provider
          const agent = installedAgents.find((a) => a.name === results.agent)!;
          const compatible = configuredProviders.filter((p) => p.apiType === agent.apiType);

          if (compatible.length === 0) {
            throw new Error(`没有兼容 ${agent.apiType} 的 Provider`);
          }

          return select({
            message: '选择 Provider',
            options: compatible.map((p) => ({
              label: p.displayName,
              value: p.name,
              hint: `${p.models.length} 个模型`,
            })),
          });
        },
      },
      {
        onCancel: () => {
          outro('已取消');
          process.exit(0);
        },
      },
    );

    const agent = installedAgents.find((a) => a.name === result.agent)!;
    const provider = builtinProviders.find((p) => p.name === result.provider)!;

    // 模型选择
    const modelOptions = provider.models.map((m) => ({
      label: m.name,
      value: m.name,
      hint: m.description,
    }));

    const modelAssignments: Record<string, string> = {};

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
    const yes = await confirm({ message: '确认启用？' });

    if (isCancel(yes) || !yes) {
      outro('已取消');
      process.exit(0);
    }

    // 保存
    const enabledState = await getEnabledState();
    enabledState[agent.name] = {
      provider: provider.name,
      modelAssignments,
    };
    await setEnabledState(enabledState);

    outro('✅ 配置完成');
  } catch (err) {
    outro(`❌ ${err instanceof Error ? err.message : '未知错误'}`);
    process.exit(1);
  }
}
