#!/usr/bin/env node

import { Command } from 'commander';
import { openTUI } from './ui/index.js';

const program = new Command();

program
  .name('agentbaton')
  .description('一个基于 CLI 的编程智能体配置管理器')
  .version('0.3.0');

// 注册子命令
// program.addCommand(createAgentCommand());
// program.addCommand(createProviderCommand());
// program.addCommand(createEnableCommand());
// program.addCommand(createDisableCommand());

// 默认动作：交互式配置
program.action(async () => {
  await openTUI();
});

// 解析命令行参数
await program.parseAsync(process.argv);
