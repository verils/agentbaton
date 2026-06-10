#!/usr/bin/env node

import { Command } from 'commander';
import { createAgentCommand } from './commands/agent.js';
import { createProviderCommand } from './commands/provider.js';
import { createEnableCommand } from './commands/enable.js';
import { createDisableCommand } from './commands/disable.js';
import { runPrompt } from './commands/interactive.js';
import { initBatonDirs } from './config/loader.js';

const program = new Command();

program
  .name('agentbaton')
  .description('一个基于 CLI 的编程智能体配置管理器')
  .version('0.1.0');

// 注册子命令
program.addCommand(createAgentCommand());
program.addCommand(createProviderCommand());
program.addCommand(createEnableCommand());
program.addCommand(createDisableCommand());

// 默认动作：交互式配置
program.action(async () => {
  await runPrompt();
});

// 初始化目录结构
await initBatonDirs();

// 解析命令行参数
await program.parseAsync(process.argv);
