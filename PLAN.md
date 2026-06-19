# Agent Baton — 项目规划

## 功能规格

### 核心概念

Agent Baton 管理和连接两类实体：

- **Agent（智能体）**：本地已安装的编程智能体（如 Claude Code、Codex CLI、Gemini CLI 等）。通过 TypeScript 定义描述其配置文件位置、API 协议类型、模型槽位和配置解析逻辑。
- **Provider（模型供应商）**：提供 LLM API 的服务方（如百炼、火山引擎、腾讯云、DeepSeek 等）。通过 TypeScript 模板定义其 API 端点和可用模型列表。

Agent 与 Provider 通过 **API 类型**（`openai` / `anthropic` / `google`）匹配。agent 声明自己使用的 API 类型，provider 声明自己提供的 API 类型，agentbaton 在两者匹配时才允许配置。

### 设计原则

- **单向写入**：agentbaton 只将配置写入智能体的原生配置文件，不尝试管理它们的状态
- **配置文件为准**：所有显示均从智能体的原生配置文件读取，外部修改会实时反映
- **声明式定义**：agent 和 provider 均通过 TypeScript 数据定义，不包含硬编码适配逻辑
- **单次加载**：config 在启动时加载一次，之后通过引用传递，仅保存不重复加载

### 约束

- agentbaton 不选择/切换"当前活跃智能体"，所有已安装的 agent 均可独立配置
- agentbaton 不维护 agent 的安装/卸载，仅识别已安装的 agent
- agentbaton 只做单向写入智能体的配置文件，不尝试管理它们的状态

### 数据模型

#### 实体关系

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

#### Agent 类型

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

#### Provider 类型

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

#### 级联删除规则

- **删除 Provider**：遍历所有 Agent 的 Assignment，清除 `currentProvider` 匹配项及 `history` 中的对应条目；对受影响的 agent 调用 `saveConfig` 清除智能体配置文件
- **删除 Agent**：直接移除该 Agent 的整条 Assignment 记录

### 模型获取

#### 获取策略（三级降级）

1. **动态获取**：调用 `fetchModels(apiType, baseUrl, apiKey)` 获取实时模型列表
2. **静态兜底**：接口不可用或超时时，使用 Provider 内置的静态模型列表（可能过时）
3. **手动填写**：用户自行输入模型 ID

仅实现 OpenAI 兼容的 `/v1/models` 接口。Anthropic 类型接口无公开端点，直接使用静态兜底。

### 交互式菜单

```
主界面
├── 设置智能体
│   └── 选择智能体
│       ├── 查看当前设置（从配置文件读取）
│       ├── 设置模型供应商（切换时保留/恢复历史模型槽位）
│       └── 设置模型（从供应商模型列表选择，支持手动输入）
├── 设置模型供应商
│   ├── [已添加的供应商列表]
│   │   └── 设置供应商
│   │       ├── 设置模型（从 API 获取 / 手动添加 / 清空）
│   │       ├── 设置 API Key
│   │       ├── 清除 API Key
│   │       └── 删除此模型供应商（含级联清理）
│   ├── 添加模型供应商
│   │   ├── [内置供应商模板列表]（支持多付费模式）
│   │   └── 自定义模型供应商
│   └── 返回
├── 查看当前设置（概览所有智能体和供应商）
└── 退出
```

### 内置定义

#### 智能体

| 名称 | 命令 | API 类型 | 配置文件（Linux） | 模型槽位 |
|------|------|----------|-------------------|----------|
| Claude Code | `claude` | anthropic | `~/.claude` | Opus, Sonnet, Haiku |
| Codex CLI | `codex` | openai | `~/.codex` | default |
| Gemini CLI | `gemini` | google | `~/.gemini/settings.json` | default |
| MiMoCode | `mimo` | openai | `~/.config/qwen/config.json` | default |
| OpenCode | `opencode` | openai | `~/.config/opencode/config.json` | default |
| Qwen Code | `qwen` | openai | `~/.config/qwen` | default |
| Qoder | `qoder` | openai | `~/.config/qoder/config.json` | default |
| Qoder CN | `qoder-cn` | openai | `~/.config/qoder-cn/config.json` | default |

#### 模型供应商

百炼、DeepSeek、MiniMax、Moonshot、腾讯云、火山引擎、小米 MiMo、智谱

---

## 开发计划

### 当前状态评估

#### ✅ 业务闭环

核心流程可以走通：
```
添加供应商 → 配置智能体绑定供应商 → 设置模型 → 使用
```

#### ✅ 已实现

- 多供应商模式（`multiProvider`、`AgentProviderBinding`）
- 动态模型获取（`fetchModels()`）
- 多付费模式（`ProviderPricing`）
- 配置 I/O 测试（`tests/config-io.test.ts`）
- Agent 元数据测试（`tests/agent/*.test.ts`）

#### ⚠️ 已知问题

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 1 | ~~`expandHome('~')` 边界 bug~~ | ~~中~~ | ✅ 已修复：改用 `path.replace(/^~/, homedir())` |
| 2 | ~~`pnpm lint` 无法执行~~ | ~~低~~ | ✅ 已修复：添加 `eslint.config.js`（flat config） |
| 3 | ~~`vite.config.ts` external 残留~~ | ~~低~~ | ✅ 已修复：移除 `yaml`、`chalk` |
| 4 | `ProviderPreset` deprecated 字段 | 低 | `apiType`、`baseUrl` 已标记废弃，新代码应使用 `pricing[].endpoints` |
| 5 | 4 个 agent 未注册 | 低 | `mimoCode`、`qoder`、`qoderCn`、`qwenCode` 被注释，需决定启用或删除 |
| 6 | 数据模型文档过时 | 低 | PLAN.md 功能规格中的 Agent/Provider 类型定义与实际代码不一致 |

---

### 改进计划

#### ~~P0 - 立即处理~~ ✅

**~~1. 修复 `expandHome` 边界 bug~~** ✅

```ts
// 已修复：path.replace(/^~/, homedir())
```

涉及文件：`src/utils/path.ts`

**~~2. 清理 vite.config.ts external 列表~~** ✅

移除 `yaml`、`chalk`（`package.json` 中无依赖）。如未来需要再加回。

涉及文件：`vite.config.ts`

#### P1 - 中优先级

**~~3. 添加 eslint 配置~~** ✅

二选一：
- 添加 `eslint.config.js`（flat config，ESM 友好）
- 或从 `package.json` 移除 lint 脚本，避免误导

**4. 增加快捷返回主菜单**

在深层菜单中增加"返回主菜单"选项。

```typescript
const action = await select({
  message: `${agent.name}：`,
  options: [
    { value: 'chooseProvider', label: '设置模型供应商' },
    { value: 'chooseModel', label: '设置模型' },
    { value: '__main_menu__', label: '↩ 返回主菜单' },
    backOption,
  ],
});
```

涉及文件：`src/prompt/agent.ts`、`src/prompt/provider.ts`

**5. 清理 deprecated 字段**

评估 `ProviderPreset.apiType` 和 `ProviderPreset.baseUrl` 的使用情况：
- 若无调用方 → 直接移除
- 若有调用方 → 迁移到 `pricing[].endpoints` 后移除

**6. 处理未注册 agent**

对 `mimoCode`、`qoder`、`qoderCn`、`qwenCode` 逐个评估：
- 已可用 → 取消注释注册
- 未完成 → 标记为开发中或删除文件

#### P2 - 低优先级

**7. 配置导入导出**

- 导出当前配置到文件
- 从文件导入配置
- 合并或覆盖选项

**8. 批量操作**

- 选择多个智能体
- 统一绑定同一供应商
- 统一设置模型

**9. 更新功能规格文档**

PLAN.md 中的 Agent/Provider 类型定义与实际代码有差异，需同步更新。

---

### 代码质量改进

**1. 错误处理统一**

当前错误处理不一致，部分地方有回滚，部分没有。建议：
- 抽取通用的事务性保存函数
- 统一错误提示格式

**2. 类型安全**

部分地方使用了 `as string` 类型断言，建议：
- 使用 discriminated union 处理 cancel 逻辑
- 减少类型断言

**3. 测试扩展**

已有测试覆盖：配置 I/O、Agent 元数据。建议补充：
- 级联删除逻辑
- 供应商兼容性检查
- `expandHome` 边界用例
