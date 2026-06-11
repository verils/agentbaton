# Agent Baton — 功能规格

## 核心概念

Agent Baton 管理和连接两类实体：

- **Agent（智能体）**：本地已安装的编程智能体（如 Claude Code、Codex CLI、Gemini CLI 等）。通过 TypeScript 定义描述其配置文件位置、API 协议类型、模型槽位和配置解析逻辑。
- **Provider（模型供应商）**：提供 LLM API 的服务方（如百炼、火山引擎、腾讯云、DeepSeek 等）。通过 TypeScript 模板定义其 API 端点和可用模型列表。

Agent 与 Provider 通过 **API 类型**（`openai` / `anthropic` / `google`）匹配。agent 声明自己使用的 API 类型，provider 声明自己提供的 API 类型，baton 在两者匹配时才允许配置。

### 设计原则

- **单向写入**：baton 只将配置写入智能体的原生配置文件，不尝试管理它们的状态
- **配置文件为准**：所有显示均从智能体的原生配置文件读取，外部修改会实时反映
- **声明式定义**：agent 和 provider 均通过 TypeScript 数据定义，不包含硬编码适配逻辑

## 数据模型

### AgentDefinition

```typescript
interface AgentDefinition {
  name: string;                    // 唯一标识，如 'claude-code'
  displayName: string;             // 显示名称，如 'Claude Code'
  command: string;                 // 可执行命令，如 'claude'，用于检测是否已安装
  apiType: ApiType;                // 'openai' | 'anthropic' | 'google'
  configPath: PlatformConfigPath;  // 各平台的原生配置文件路径
  configFormat: 'json' | 'yaml' | 'toml' | string;
  models: ModelSlot[];             // 模型槽位定义
  parseConfig(config: Record<string, unknown>): AgentConfigSummary;  // 解析配置文件
}
```

### ModelSlot

```typescript
interface ModelSlot {
  slot: string;        // 槽位标识，如 'default', 'opus', 'sonnet'
  name: string;        // 写入配置文件的字段名，如 'model', 'Opus'
  description: string; // UI 描述
}
```

### AgentConfigSummary

由 `parseConfig` 从智能体原生配置文件解析得出：

```typescript
interface AgentConfigSummary {
  models: Record<string, string>;  // slot → model value
  baseUrl?: string;
  apiKey?: string;
}
```

### ProviderTemplate

```typescript
interface ProviderTemplate {
  id: string;
  name: string;
  endpoints?: Record<string, ProviderEndpoint>;
  models: ProviderModel[];
}
```

### Provider（用户已添加的供应商实例）

```typescript
interface Provider {
  id: string;          // UUID
  name: string;
  apiKey: string;
  endpoints: Endpoint[];
  models: Model[];
}
```

## 存储结构

```
~/.agentbaton/
└── config.json    # 统一配置文件
```

`config.json` 结构：

```json
{
  "agents": {},
  "providers": [],
  "enabledAgents": {}
}
```

- **providers**：用户已添加的供应商实例列表（含 API Key、端点、模型）
- **enabledAgents**：agent-provider 启用状态映射（`agentName → { provider, modelAssignments }`）

## 智能体检测

baton 通过 `which`（Linux/macOS）或 `where`（Windows）检测智能体命令是否可用。仅展示已安装的智能体。

## 配置读取

`handleView` 从智能体的原生配置文件读取当前设置，通过各 agent 定义的 `parseConfig` 方法解析。显示内容包括：

- 安装状态
- 配置文件路径
- API 类型
- API Key（脱敏显示，仅前 4 后 4 位）
- Base URL（如有）
- 各模型槽位当前值

## 交互式菜单

```
主界面
├── 设置智能体
│   └── 选择智能体
│       ├── 查看当前设置（从配置文件读取）
│       ├── 设置模型供应商
│       └── 设置模型
├── 设置模型供应商
│   ├── [已添加的供应商列表]
│   ├── 添加模型供应商
│   │   ├── [内置供应商模板列表]
│   │   └── 自定义模型供应商
│   └── 返回
├── 查看当前设置（概览所有智能体和供应商）
└── 退出
```

## 内置定义

### 智能体

| 名称 | 命令 | API 类型 | 配置文件（Linux） | 模型槽位 |
|------|------|----------|-------------------|----------|
| Claude Code | `claude` | anthropic | `~/.claude/settings.json` | Opus, Sonnet, Haiku |
| Codex CLI | `codex` | openai | `~/.codex/config.json` | default |
| Gemini CLI | `gemini` | google | `~/.gemini/settings.json` | default |
| MiMoCode | `mimo` | openai | `~/.config/qwen/config.json` | default |
| OpenCode | `opencode` | openai | `~/.config/opencode/config.json` | default |
| Qwen Code | `qwen` | openai | `~/.config/qwen/config.json` | default |
| Qoder | `qoder` | openai | `~/.config/qoder/config.json` | default |
| Qoder CN | `qoder-cn` | openai | `~/.config/qoder-cn/config.json` | default |

### 模型供应商

百炼、DeepSeek、MiniMax、Moonshot、腾讯云、火山引擎、小米 MiMo、智谱

## 约束

- baton 不选择/切换"当前活跃智能体"，所有已安装的 agent 均可独立配置
- baton 不维护 agent 的安装/卸载，仅识别已安装的 agent
- baton 不存储绑定信息，所有效果以智能体配置文件为准
- baton 只做单向写入智能体的配置文件，不尝试管理它们的状态
