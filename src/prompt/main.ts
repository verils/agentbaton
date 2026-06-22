import { intro, isCancel, log, outro, select } from '@clack/prompts';
import { loadConfig } from '../config/index.js';
import { getStringWidth, isCommandAvailable, installStdinRecovery, maskApiKey, padEndWidth } from '../utils/index.js';
import { openAgentMenu } from './agent.js';
import { openProviderMenu } from './provider.js';
import { builtinAgents } from "../agent/builtin.js";
import { AgentBatonConfig } from "../types/index.js";

export async function runPrompt(): Promise<void> {
  installStdinRecovery();

  const config = await loadConfig();

  intro('AgentBaton — 智能体设置管理');

  await displayInfo(config);

  while (true) {
    const choice = await select({
      message: '选择菜单：',
      options: [
        { value: 'agent', label: '智能体' },
        { value: 'provider', label: '模型供应商' },
        { value: 'display', label: '查看当前设置' },
        { value: 'exit', label: '退出' },
      ],
    });

    if (isCancel(choice) || choice === 'exit') {
      break;
    }

    try {
      switch (choice) {
        case 'agent':
          await openAgentMenu(config);
          await displayInfo(config);
          break;
        case 'provider':
          await openProviderMenu(config);
          await displayInfo(config);
          break;
        case 'display':
          await displayInfo(config);
          break;
      }
    } catch (e) {
      log.error(`操作失败：${e instanceof Error ? e.message : String(e)}`);
    }
  }

  outro('再见 👋');
}

/**
 * 查看配置 — 展示所有智能体和供应商的配置概览
 */
async function displayInfo(config: AgentBatonConfig): Promise<void> {
  log.info('智能体 🤖');
  const agentWidth = Math.max(...builtinAgents.map(a => getStringWidth(a.name)));
  const agents = []
  for (const agent of builtinAgents) {
    const installed = await isCommandAvailable(agent.command);
    const status = installed ? '✅ 已安装' : '❌ 未安装';
    agents.push(`${padEndWidth(agent.name, agentWidth)} （${status}）`)
  }
  log.message(agents);

  log.info('模型供应商 🔌');
  if (config.providers.length === 0) {
    log.message('  （暂无供应商，请先添加）');
  } else {
    const providerWidth = Math.max(...config.providers.map(a => getStringWidth(a.name)));
    const providers = []
    for (const provider of config.providers) {
      providers.push(`${padEndWidth(provider.name, providerWidth)} （${maskApiKey(provider.apiKey)}）`)
    }
    log.message(providers);
  }
}
