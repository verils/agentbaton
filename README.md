# Agent Baton

<div align="center">

**一个基于 CLI 的编程智能体配置管理器**

类似于 CC-Switch，支持快速切换和管理多个 AI 编程助手的配置

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

</div>

## 📖 简介

Agent Baton 是一个强大的命令行工具，用于管理和切换不同 AI 编程智能体的配置。它让你能够在多个 AI 助手之间无缝切换，并内置了对国内主流云服务平台的支持。

### ✨ 主要特性

- 🔄 **多智能体支持**：轻松管理 Claude Code、Codex、Gemini CLI、OpenCode、Qwen、Qoder、Crush 等主流编程智能体
- ☁️ **国内云平台集成**：内置百炼、火山引擎、腾讯云、智谱、MiniMax、月之暗面、DeepSeek、小米 MiMo 等平台的 API 配置
- ⚡ **快速切换**：通过简单的命令在不同智能体配置间快速切换
- 🔧 **配置管理**：集中管理所有智能体的 API 密钥、模型参数和自定义设置
- 💻 **CLI 友好**：简洁直观的命令行界面，提升开发效率

## 🚀 快速开始

### 基本用法

```bash
# 查看所有可用的智能体
agentbaton list

# 切换到指定智能体
agentbaton switch claude

# 查看当前激活的智能体
agentbaton current

# 配置 API 密钥
agentbaton config set --api-key YOUR_API_KEY

# 添加新的云平台配置
agentbaton platform add bailian
```

## 🎯 支持的智能体

| 智能体 | 状态 | 说明 |
|--------|------|------|
| Claude Code | ✅ | Anthropic 的编程助手 |
| Codex | ✅ | OpenAI 的代码生成模型 |
| Gemini CLI | ✅ | Google 的 Gemini 助手 |
| OpenCode | ✅ | 开源代码助手 |
| Qwen | ✅ | 阿里云通义千问 |
| Qoder | ✅ | 智能编程助手 |
| Crush | ✅ | 代码优化工具 |

## ☁️ 支持的云平台

| 平台 | 状态 | API 支持 |
|------|------|----------|
| 百炼 (Bailian) | ✅ | 完整支持 |
| 火山引擎 | ✅ | 完整支持 |
| 腾讯云 | ✅ | 完整支持 |
| 智谱 AI | ✅ | 完整支持 |
| MiniMax | ✅ | 完整支持 |
| 月之暗面 (Moonshot) | ✅ | 完整支持 |
| DeepSeek | ✅ | 完整支持 |
| 小米 MiMo | ✅ | 完整支持 |

## 📋 命令参考

### 智能体管理

```bash
# 列出所有智能体
agentbaton list

# 切换智能体
agentbaton switch <name>

# 查看当前智能体
agentbaton current

# 添加自定义智能体
agentbaton add <name> --config <path>
```

### 配置管理

```bash
# 设置配置项
agentbaton config set --key value

# 获取配置项
agentbaton config get <key>

# 删除配置项
agentbaton config delete <key>

# 导出配置
agentbaton config export > config.json

# 导入配置
agentbaton config import config.json
```

### 平台管理

```bash
# 列出可用平台
agentbaton platform list

# 添加平台配置
agentbaton platform add <platform>

# 更新平台 API 密钥
agentbaton platform update <platform> --api-key KEY
```

## 🔐 安全说明

- API 密钥存储在本地配置文件中，不会上传到任何服务器
- 建议使用环境变量管理敏感信息
- 配置文件默认位置：`~/.agentbaton/config.json`

## 🛠️ 开发指南

### 环境要求

- Node.js >= 22.0.0
- PNPM >= 9.0.0
- TypeScript >= 5.0

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/yourusername/agent-baton.git
cd agent-baton

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

- 项目主页：[GitHub](https://github.com/verils/agent-baton)
- 问题反馈：[Issues](https://github.com/verils/agent-baton/issues)

---

<div align="center">

Made with ❤️ by Agent Baton Team

</div>
