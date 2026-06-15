# Agent Baton

<div align="center">

**基于 CLI 的编程智能体配置管理器**

为编程智能体配置 Provider，以 TUI 交互式操作为主，同时支持一次性命令

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

</div>

## 📖 简介

Agent Baton 是一个命令行工具，用于识别本地已安装的编程智能体，并为它们配置云厂商（Provider）的 API 连接。以 TUI 交互式操作为主，同时支持一次性命令。

### ✨ 主要特性

- 🖥️ **TUI 交互式界面**：以终端交互式操作为主，直观浏览和管理配置，同时支持一次性命令快速操作
- 🔍 **自动识别**：自动扫描本地已安装的编程智能体，无需手动配置
- ☁️ **多 Provider 支持**：内置百炼、火山引擎、腾讯云、智谱、MiniMax、月之暗面、DeepSeek、小米 MiMo 等国内主流云厂商
- ⚡ **一键启用**：配置好 Provider 后，为 Agent 一键启用并写入配置文件
- 🔧 **API 类型匹配**：自动校验 Agent 与 Provider 的 API 类型兼容性
- 💻 **CLI 友好**：简洁直观的命令行界面，提升开发效率

## 🚀 快速开始

### 安装

```bash
# 使用 npm
npm install -g @verils/agentbaton

# 使用 pnpm
pnpm add -g @verils/agentbaton

# 使用 yarn
yarn global add @verils/agentbaton
```

### 基本用法

```bash
# 启动 TUI 交互界面（推荐）
agentbaton

# 查看已识别的智能体
agentbaton agent

# 配置 Provider API Key
agentbaton provider deepseek --key sk-xxxx

# 为智能体启用 Provider
agentbaton enable claude-code deepseek
```

## 🎯 支持的智能体

| 智能体 | 状态 | 说明 |
|--------|------|------|
| Claude Code | ✅ | Anthropic 的编程助手 |
| Codex CLI | ✅ | OpenAI 的代码生成工具 |
| Gemini CLI | ✅ | Google 的 Gemini 助手 |
| OpenCode | ✅ | 开源代码助手 |
| Qwen Code | ✅ | 阿里云通义千问 |
| Qoder | ✅ | 智能编程助手 |
| Crush | ✅ | 代码优化工具 |

## ☁️ 支持的 Provider

| Provider | 状态 | API 支持 |
|----------|------|----------|
| 百炼 (Bailian) | ✅ | 完整支持 |
| 火山引擎 | ✅ | 完整支持 |
| 腾讯云 | ✅ | 完整支持 |
| 智谱 AI | ✅ | 完整支持 |
| MiniMax | ✅ | 完整支持 |
| 月之暗面 (Moonshot) | ✅ | 完整支持 |
| DeepSeek | ✅ | 完整支持 |
| 小米 MiMo | ✅ | 完整支持 |

## 📋 命令参考

```bash
agentbaton                                  # 启动 TUI 交互界面

# 智能体
agentbaton agent                            # 列出已识别的智能体
agentbaton agent <name>                     # 查看智能体详情及 Provider 状态

# Provider
agentbaton provider                         # 列出所有 Provider
agentbaton provider <name>                  # 查看 Provider 详情
agentbaton provider <name> --key <key>      # 配置 API Key

# 启用 / 禁用
agentbaton enable <agent> <provider>        # 为智能体启用 Provider
agentbaton disable <agent> <provider>       # 禁用 Provider
```

## 🔐 安全说明

- API Key 存储在本地配置文件中，不会上传到任何服务器
- 配置文件默认位置：`~/.agentbaton/`
- 建议使用环境变量管理敏感信息

## 🛠️ 开发指南

### 环境要求

- Node.js >= 22.0.0
- PNPM >= 9.0.0
- TypeScript >= 5.0

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/verils/agentbaton.git
cd agentbaton

# 安装依赖
pnpm install

# 启动开发模式
pnpm dev

# 构建项目
pnpm build

# 运行测试
pnpm test
```

## 📝 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📮 联系方式

- 项目主页：[GitHub](https://github.com/verils/agentbaton)
- 问题反馈：[Issues](https://github.com/verils/agentbaton/issues)

---

<div align="center">

Made with ❤️ by Agent Baton Team

</div>
