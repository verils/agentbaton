# AGENTS.md

面向智能体的项目参考文档。如需了解项目概况和使用方法，见 `README.md`；计划与进度见 `PLAN.md`。

## 项目简介

CLI 工具 (ESM)，为编程智能体（Claude Code、Codex CLI 等）配置云厂商 API 密钥。TypeScript 编写，tsc 构建，目标 Node.js 22+。

## 常用命令

| 操作 | 命令 |
|------|------|
| 构建 | `pnpm build` |
| 测试 | `pnpm test` |
| 测试 (watch) | `pnpm test:watch` |
| 类型检查 | `pnpm typecheck` |
| Lint | `pnpm lint` |
| 运行 CLI | `pnpm start` 或 `node dist/cli.js` |
| 开发 (watch) | `pnpm dev` |

完成任务前必须运行 `pnpm typecheck` 和 `pnpm test`。

## 架构

单包仓库。入口：`src/cli.ts` → `dist/cli.js`。

```
src/
  cli.ts                # Commander 入口，委托给 ui/
  agent/
    builtin.ts          # Agent 注册表
    detect.ts           # 命令检测（where/which），判断 agent 是否已安装
    claude-code.ts      # 各 agent 定义（一个文件一个 agent）
    ...
  provider/
    presets/
      index.ts          # Provider 注册表
      bailian.ts        # 各 provider 模板（一个文件一个 provider）
      ...
  config/
    index.ts            # re-export
    loader.ts           # loadConfig/saveConfig、readJson/writeJson、readToml/writeToml
    paths.ts            # ~/.agentbaton/ 路径常量
  ui/
    main.tsx            # Ink App 组件 + 导航状态机 + 主菜单
    agent.tsx           # 智能体详情屏幕（单/多供应商模式）
    provider.tsx        # findProvider 等纯逻辑
    back.ts             # 返回选项常量
    index.tsx           # re-export
    components/
      select-menu.tsx   # SelectMenu 封装组件（Enter 提交）
  types/
    index.ts            # re-export
    agent.ts            # AgentDefinition、AgentNativeConfig 等
    config.ts           # AgentBatonConfig
    model.ts            # ApiType、Model
    provider.ts         # ProviderPreset、ProviderPricing 等
  utils/
    index.ts            # re-export
    path.ts             # expandHome、resolvePlatformHome、getCurrentPlatform
    string.ts           # 字符串宽度计算
    stdin.ts            # stdin 工具
```

## 核心模式

- **Agent 定义**：每个 agent 是一个 `const` 对象，实现 `AgentDefinition`（`src/agent/<name>.ts`），在 `src/agent/builtin.ts` 注册。接口方法为 `loadNativeConfig()`（读取原生配置）和 `saveNativeConfig()`（写入原生配置）。
- **Provider 模板**：每个 provider 是一个 `const`，实现 `ProviderPreset`（`src/provider/presets/<name>.ts`），在 `src/provider/presets/index.ts` 注册。Preset 是模板，用户创建 provider 实例后独立存储，无持久引用。
- **配置持久化**：用户配置统一存储在 `~/.agentbaton/config.json`（JSON）。TOML 读写由独立的 `readToml`/`writeToml` 处理（用于 agent 原生配置文件）。
- **API 类型匹配**：Agent 声明 `ApiType`（`'openai' | 'anthropic' | 'google'`）；Provider 通过 `pricing[].endpoints` 声明各端点的类型，仅匹配的 pair 可启用。
- **多供应商模式**：Agent 可设置 `multiProvider: true`，此时通过 `AgentProviderBinding` 管理多个供应商绑定，而非单一模型槽位。
- **tsc 构建**：target `node22`，ESM 格式，输出到 `dist/`。所有 npm 依赖均为 external（不打包）。
- **菜单选项值**：选项对象（如 `backOption`、`mainMenuOption`）统一在 `src/ui/back.ts` 定义，比较时用 `option.value`，不另设常量。
- **代码风格**：`if` 后的单行语句必须加花括号，不省略。

## 测试

使用 Vitest，测试文件在 `tests/` 下镜像源码结构。Agent 测试共享 `defineSyncAgentTests()` 辅助函数（`tests/agent/define-sync-agent-tests.ts`）做通用元数据断言。


