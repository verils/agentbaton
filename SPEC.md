# Agent Baton — 功能规格

## 核心概念

Agent Baton 管理和连接三类实体：

- **Agent（智能体）**：本地已安装的编程智能体（如 Claude Code、Codex CLI、Gemini CLI 等）。通过声明式 YAML 定义描述其配置文件位置、API 协议类型和模型槽位。baton 内置主流 agent 定义，用户可自行扩展。
- **Provider（云厂商）**：提供 LLM API 的服务方（如百炼、火山引擎、腾讯云、DeepSeek 等）。通过声明式 YAML 定义描述其 API 类型和可用模型列表。baton 内置主流 provider 定义，用户可自行扩展。
- **API 类型**：agent 与 provider 之间的协议桥梁。agent 声明自己使用的 API 类型，provider 声明自己提供的 API 类型，baton 在两者匹配时才允许启用。

### 设计原则

Agent 和 Provider 均通过**声明式配置（数据）定义**，而非硬编码适配逻辑。这意味着：

- 开发者不需要为每个 agent/provider 编写适配代码
- 用户可以通过 YAML 文件自行添加新 agent 或新 provider，无需等待 baton 发版
- 社区可以贡献定义到 baton 内置列表中
- baton 本身是一个通用的配置写入引擎

## Agent 定义格式

```yaml
name: claude-code                  # 唯一标识
display_name: Claude Code          # 显示名称
api_type: anthropic                # 使用的 API 协议类型
config_path: ~/.claude/settings.json  # agent 原生配置文件位置
config_format: json                # 配置文件格式：json / yaml / toml

# 模型槽位 — 描述这个 agent 需要配置哪些模型
# 单模型 agent 只需一个 slot，多模型 agent 可定义多个
models:
  - slot: main                     # 槽位标识
    key: model                     # 写入配置文件的字段名
    description: 主模型
  - slot: small_fast
    key: smallModel
    description: 轻量模型（用于简单任务）
  - slot: thinking
    key: thinkingModel
    description: 思考模型（用于推理任务）
```

简单 agent 的定义：

```yaml
name: opencode
display_name: OpenCode
api_type: openai
config_path: ~/.config/opencode/config.json
config_format: json
models:
  - slot: default
    key: model
    description: 默认模型
```

## Provider 定义格式

```yaml
name: deepseek
display_name: DeepSeek
api_type: openai                   # 提供的 API 协议类型
base_url: https://api.deepseek.com # API 基础地址

# 可用模型列表
models:
  - name: deepseek-chat
    description: DeepSeek Chat
  - name: deepseek-reasoner
    description: DeepSeek Reasoner
```

## 数据模型

```
Agent（定义）                  Provider（定义）
├── name                      ├── name
├── display_name              ├── display_name
├── api_type                  ├── api_type
├── config_path               ├── base_url
├── config_format             └── models[]
└── models[]                      └── name / description
     └── slot / key / description

Agent 运行时状态（用户侧）
├── enabled_provider: provider_name
└── model_assignments: { slot → provider_model }
```

## 存储结构

```
~/.agentbaton/
├── config.yaml                # baton 自身配置
├── providers/                 # 用户自定义 provider 定义
│   └── my-provider.yaml
├── agents/                    # 用户自定义 agent 定义
│   └── my-agent.yaml
└── state/                     # 运行时状态
    ├── provider-keys.yaml     # 已配置的 provider API Key
    └── enabled.yaml           # agent-provider 启用状态映射
```

- **内置定义**：随 baton 安装包分发，用户无需配置
- **用户自定义**：放在 `~/.agentbaton/agents/` 或 `~/.agentbaton/providers/`，优先级高于内置定义（同名覆盖）
- **状态文件**：baton 自行管理，记录 provider Key 和启用状态
- **Agent 原生配置**：由各 agent 定义中的 `config_path` 指定，baton 仅在 enable/disable 时读写

## 功能列表

### 智能体管理

| 功能 | 命令 | TUI 交互 | 说明 |
|------|------|----------|------|
| 查看已识别的 agent 列表 | `agentbaton agent` | 主界面列表展示 | 自动扫描本地已安装的 agent，合并内置和用户自定义定义 |
| 查看 agent 详情 | `agentbaton agent <name>` | 选中后展示详情面板 | 显示 API 类型、模型槽位、已启用的 provider、配置文件路径 |

### Provider 管理

| 功能 | 命令 | TUI 交互 | 说明 |
|------|------|----------|------|
| 列出所有 provider | `agentbaton provider` | provider 列表页 | 合并内置和用户自定义定义 |
| 配置 provider API Key | `agentbaton provider <name> --key <key>` | 交互式输入（隐藏回显） | 保存 Key 到本地 |
| 查看 provider 详情 | `agentbaton provider <name>` | 选中展示 | 显示 API 类型、可用模型列表、当前 Key 状态 |

### 启用/禁用

| 功能 | 命令 | TUI 交互 | 说明 |
|------|------|----------|------|
| 为 agent 启用 provider | `agentbaton enable <agent> <provider>` | 选中 agent → 选择 provider → 启用 | 校验 API 类型兼容性，为每个模型槽位选择模型，写入配置文件 |
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

### 识别 Agent

1. baton 启动时，合并内置定义和 `~/.agentbaton/agents/` 下的用户自定义定义
2. 检查每个 agent 的 `config_path` 是否存在，判断该 agent 是否已安装
3. 仅展示已安装的 agent

### 启用 Provider

1. 用户执行 `agentbaton enable <agent> <provider>` 或在 TUI 中操作
2. baton 检查 agent 和 provider 的 `api_type` 是否兼容
3. 读取 agent 定义的 `models` 列表，遍历每个槽位：
   - 展示 provider 的可用模型列表
   - 用户为每个槽位选择对应模型（TUI 中交互式选择，CLI 中需逐个指定）
4. 将选中的模型和 provider 的 API Key、base_url 写入 agent 配置文件
5. 记录启用状态和模型分配映射到 `~/.agentbaton/state/`

**多槽位 agent 示例：**

```
$ agentbaton enable claude-code deepseek

Claude Code 需要配置以下模型：

  main        主模型          → deepseek-chat
  small_fast  轻量模型        → deepseek-chat
  thinking    思考模型        → deepseek-reasoner

确认启用？(Y/n)
```

**单槽位 agent 示例：**

```
$ agentbaton enable opencode deepseek

OpenCode 需要配置模型 → deepseek-chat

确认启用？(Y/n)
```

### 禁用 Provider

1. 用户执行 `agentbaton disable <agent> <provider>` 或在 TUI 中操作
2. baton 从 agent 配置文件中移除对应的 provider 配置
3. 更新本地启用状态

## 约束

- baton 不选择/切换"当前活跃智能体"，所有已安装的 agent 均可独立配置
- baton 不维护 agent 的安装/卸载，仅识别已安装的 agent
- 启用前必须校验 API 类型兼容性
- agent 定义是纯数据（YAML），不包含适配逻辑
