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

### 约束

- baton 不选择/切换"当前活跃智能体"，所有已安装的 agent 均可独立配置
- baton 不维护 agent 的安装/卸载，仅识别已安装的 agent
- baton 只做单向写入智能体的配置文件，不尝试管理它们的状态

## 数据模型

### 实体关系

系统包含三个核心实体，职责分明：

```
ProviderPreset（代码定义的模板）
       │ 填充初始值
       ▼
Provider（用户配置实例，持久化）
       │ 通过 Assignment 关联
       ▼
Assignment（Agent × Provider 的配对记录）
```

- **ProviderPreset**：代码中的静态模板，提供供应商的默认名称、端点地址和内置模型列表。仅用于"添加供应商"时的表单预填充，填充完成后不再参与运行时逻辑。
- **Provider**：用户添加的供应商实例，持久化在 `~/.agentbaton/config.json` 中。持有实际的 API Key、端点地址和模型列表。用户可自由修改其任何字段。
- **Assignment**：Agent 与 Provider 之间的配对记录，存储当前绑定的 Provider ID 和模型槽位映射。是 Agent 的"记忆层"。

### Agent 类型

```ts
interface Agent {
  id: string;
  currentProvider: string;                        // 当前绑定的 Provider ID
  modelSlots: Record<string, string>;             // 当前 Provider 下的模型槽位映射
  history?: Record<string, Record<string, string>>; // 历史 Provider 的模型槽位记忆
}
```

- `currentProvider`：当前生效的供应商 ID，写入 agent 配置文件的依据
- `modelSlots`：当前供应商下各模型槽位对应的模型 ID
- `history`：切换供应商时，当前的 `modelSlots` 存入 `history[currentProvider]`；切回时从 history 恢复，无需重新配置

### Provider 类型

```ts
interface Provider {
  id: string;           // UUID
  name: string;
  apiKey: string;
  endpoints: Endpoint[];
  models: Model[];
}

interface Endpoint {
  type: ApiType;        // 'openai' | 'anthropic' | 'google'
  baseUrl: string;
}
```

Provider 与 Preset 没有持久引用关系。Preset 仅是模板，填充后 Provider 完全独立，用户修改 baseUrl 等字段不影响任何关联逻辑。

### 级联删除规则

- **删除 Provider**：遍历所有 Agent 的 Assignment，清除 `currentProvider` 匹配项及 `history` 中的对应条目
- **删除 Agent**：直接移除该 Agent 的整条 Assignment 记录

## 模型获取

### 获取策略（三级降级）

1. **动态获取**：调用标准 OpenAI 兼容接口 `GET /v1/models` 获取实时模型列表
2. **静态兜底**：接口不可用或超时时，使用 Provider 内置的静态模型列表（可能过时）
3. **手动填写**：用户自行输入模型 ID

### 接口支持范围

仅实现 OpenAI 兼容的 `/v1/models` 接口。原因：

- 绝大多数国内供应商的 OpenAI 兼容端点均支持此接口
- Anthropic 类型接口无公开的模型列表端点，直接使用静态兜底
- 不支持非标准私有接口，此类供应商的模型由用户手动填写

### 获取函数签名

```ts
fetchModels(baseUrl: string, apiKey: string): Promise<Model[]>
```

不依赖 Provider 或 Preset 对象，仅使用端点信息。失败时静默降级到静态列表。

## 智能体检测

baton 通过 `which`（Linux/macOS）或 `where`（Windows）检测智能体命令是否可用。仅展示已安装的智能体。

## 配置读取

从智能体的原生配置文件读取当前设置，通过各 agent 定义的 `parseConfig` 方法解析。显示内容包括：

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
│       ├── 设置模型供应商（切换时保留历史配置）
│       └── 设置模型（从供应商模型列表选择）
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
