# Agent Baton — 功能规格

## 核心概念

Agent Baton 管理和连接三类实体：

- **Agent（智能体）**：本地已安装的编程智能体（如 Claude Code、Codex CLI、Gemini CLI 等）。baton 维护一份内置的 agent 定义列表，描述每个 agent 支持的 API 类型及配置文件位置。
- **Provider（云厂商）**：提供 LLM API 的服务方（如百炼、火山引擎、腾讯云、DeepSeek 等）。baton 维护一份内置的 provider 列表，描述每个 provider 支持的 API 类型。
- **API 类型**：agent 与 provider 之间的协议桥梁。agent 声明自己支持哪些 API 类型，provider 声明自己提供哪些 API 类型，baton 在两者匹配时才允许启用。

## 数据模型

```
Agent                    Provider
├── name                 ├── name
├── supported_api_types  ├── supported_api_types
├── config_file_path     ├── api_key（用户配置，持久化）
└── enabled_providers    └── ...
     └── [{provider, api_type}]
```

baton 自身状态（存储在 `~/.agentbaton/`）：
- 已配置的 provider API Key
- 各 agent 的 provider 启用状态

## 功能列表

### 智能体管理

| 功能 | 命令 | TUI 交互 | 说明 |
|------|------|----------|------|
| 查看已识别的 agent 列表 | `agentbaton agent` | 主界面列表展示 | 自动扫描本地已安装的 agent |
| 查看 agent 详情 | `agentbaton agent <name>` | 选中后展示详情面板 | 显示支持的 API 类型、已启用的 provider、配置文件路径 |

### Provider 管理

| 功能 | 命令 | TUI 交互 | 说明 |
|------|------|----------|------|
| 列出所有 provider | `agentbaton provider` | provider 列表页 | 展示所有支持的云厂商 |
| 配置 provider API Key | `agentbaton provider <name> --key <key>` | 交互式输入（隐藏回显） | 保存 Key 到本地 |
| 查看 provider 详情 | `agentbaton provider <name>` | 选中展示 | 显示支持的 API 类型、当前 Key 状态 |

### 启用/禁用

| 功能 | 命令 | TUI 交互 | 说明 |
|------|------|----------|------|
| 为 agent 启用 provider | `agentbaton enable <agent> <provider>` | 选中 agent → 选择 provider → 启用 | 校验 API 类型兼容性，写入 agent 配置文件 |
| 禁用 agent 的 provider | `agentbaton disable <agent> <provider>` | 选中 agent → 选择 provider → 禁用 | 还原 agent 配置文件 |

## 命令速览

```bash
agentbaton                                  # 启动 TUI 交互界面

agentbaton agent                            # 列出已识别的 agent
agentbaton agent <name>                     # 查看 agent 详情

agentbaton provider                         # 列出所有 provider
agentbaton provider <name>                  # 查看 provider 详情
agentbaton provider <name> --key <key>      # 配置 API Key

agentbaton enable <agent> <provider>        # 启用 provider（写入配置）
agentbaton disable <agent> <provider>       # 禁用 provider（还原配置）
```

## 关键流程

### 启用 Provider

1. 用户执行 `agentbaton enable <agent> <provider>` 或在 TUI 中操作
2. baton 检查 agent 和 provider 是否有兼容的 API 类型
3. 若兼容，将 provider 的 API Key 及 endpoint 写入 agent 配置文件
4. 记录启用状态到 `~/.agentbaton/` 本地存储

### 禁用 Provider

1. 用户执行 `agentbaton disable <agent> <provider>` 或在 TUI 中操作
2. baton 从 agent 配置文件中移除对应的 provider 配置
3. 更新本地启用状态

## 存储

- 配置文件目录：`~/.agentbaton/`
- 存储内容：provider API Key、agent-provider 启用状态映射
- Agent 自身的配置文件由 agent 原生位置决定，baton 仅做读写

## 约束

- baton 不选择/切换"当前活跃智能体"，所有已安装的 agent 均可独立配置
- baton 不维护 agent 的安装/卸载，仅识别已安装的 agent
- 启用前必须校验 API 类型兼容性
