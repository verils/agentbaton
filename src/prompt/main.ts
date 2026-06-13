import { intro, isCancel, log, outro, select } from '@clack/prompts';
import { loadConfig } from '../config';
import { getStringWidth, isCommandAvailable, maskApiKey, padEndWidth } from '../utils';
import { openAgentMenu } from './agent';
import { openProviderMenu } from './provider';
import { builtinAgents } from "../agent/builtin";
import { AgentBatonConfig } from "../types";

export async function runPrompt(): Promise<void> {
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

    switch (choice) {
      case 'agent':
        await openAgentMenu(config);
        break;
      case 'provider':
        await openProviderMenu(config);
        break;
      case 'display':
        await displayInfo(config);
        break;
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
  const providerWidth = Math.max(...config.providers.map(a => getStringWidth(a.name)));
  const providers = []
  for (const provider of config.providers) {
    providers.push(`${padEndWidth(provider.name, providerWidth)} （${maskApiKey(provider.apiKey)}）`)
  }
  log.message(providers);
}
