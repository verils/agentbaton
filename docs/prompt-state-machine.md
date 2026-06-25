# Prompt 状态机文档

本文档完整描述 AgentBaton TUI 的所有屏幕状态、用户操作、转换条件和数据流。

> 基线版本：基于 `src/prompt/` 目录源码。迁移或重构时以此文档为验收参考。

---

## 1. 导航选项（全局）

定义于 `src/prompt/back.ts`，在所有 `select` 菜单中注入：

| 常量 | `value` | `label` | 作用 |
|------|---------|---------|------|
| `backOption` | `'__back__'` | `'↑ 返回上一级菜单'` | 返回上一层 |
| `mainMenuOption` | `'__main_menu__'` | `'↩ 返回主菜单'` | 跳回主菜单 |

每个状态统一检查三种退出信号：`isCancel()`（Ctrl+C）、`backOption.value`、`mainMenuOption.value`。

---

## 2. 状态总览

| ID | 名称 | 源文件 | 循环？ | 说明 |
|----|------|--------|--------|------|
| S0 | 信息展示 | `main.ts` | 否 | 展示智能体安装状态 + 供应商列表 |
| S1 | 主菜单 | `main.ts` | `while(true)` | 四选一入口 |
| S2 | 智能体选择 | `agent.ts` | 否 | 列出已安装智能体 |
| S3-SP | 单供应商智能体菜单 | `agent.ts` | `while(true)` | 查看配置 / 切换供应商 / 设置模型 |
| S3-MP | 多供应商智能体菜单 | `agent.ts` | `while(true)` | 添加/移除供应商绑定 |
| S4 | 选择供应商 | `agent.ts` | 否 | 切换当前供应商（含 history 机制） |
| S5 | 选择模型 | `agent.ts` | `for (slot)` | 按槽位逐个选模型 |
| S6 | 添加供应商绑定 | `agent.ts` | 否 | 多供应商模式下绑定新供应商 |
| S7 | 移除供应商绑定 | `agent.ts` | 否 | 多供应商模式下解绑供应商 |
| P1 | 供应商选择 | `provider.ts` | 否 | 列出已有供应商 + 添加入口 |
| P2 | 添加供应商 | `provider.ts` | 否 | 预设 vs 自定义分支 |
| P2p | 添加预设供应商 | `provider.ts` | 否 | 选付费模式 + 输入 API Key |
| P2c | 添加自定义供应商 | `provider.ts` | 否 | 名称 + API 类型 + URL + Key |
| P3 | 修改供应商 | `provider.ts` | `while(true)` | 模型管理 / Key 管理 / 删除 |
| P4 | 设置模型 | `provider.ts` | 否 | 获取/手动添加/清空三选一 |
| P4a | 从 API 获取模型 | `provider.ts` | 否 | HTTP 调用 preset.fetchModels |
| P4b | 手动添加模型 | `provider.ts` | 否 | 输入 ID + 名称 |
| P4c | 清空模型列表 | `provider.ts` | 否 | 确认后清空 |
| P5 | 设置 API Key | `provider.ts` | 否 | password 输入 |
| P6 | 清除 API Key | `provider.ts` | 否 | 确认后清除 |
| P7 | 删除供应商 | `provider.ts` | 否 | 级联清理 + 删除 |

---

## 3. 状态图

```
                              ┌──────────────┐
                              │   [START]    │
                              │  runPrompt() │
                              └──────┬───────┘
                                     │
                         loadConfig() + installStdinRecovery()
                                     │
                                     ▼
                   ┌─────────────────────────────────────┐
                   │          S0: 信息展示               │
                   │  displayInfo(config)                │
                   │  - 智能体列表 + 安装状态              │
                   │  - 供应商列表 + Key 掩码              │
                   └────────────────┬────────────────────┘
                                    │
                   ┌────────────────▼────────────────────┐
              ┌───►│            S1: 主菜单               │
              │    │  '选择菜单：'                        │
              │    │                                     │
              │    │  [智能体]        ──► S2              │
              │    │  [模型供应商]    ──► P1              │
              │    │  [查看当前设置]  ──► S0              │
              │    │  [退出]          ──► END             │
              │    │  [Cancel]        ──► END             │
              │    └──┬──────────┬───────────┬───────────┘
              │       │          │           │
              │       │          │           └──► outro('再见') ──► END
              │       │          │
              │       ▼          ▼
              │     S2          P1
              │   (agent)     (provider)
              │
              │   从子菜单返回后：displayInfo() → 回到 S1
              └──────────────────────────────────────────┘


  ┌─── Agent Path ──────────────────────────────────────────────────┐
  │                                                                 │
  │  S2: 智能体选择                                                  │
  │  ├─ 选项: [已安装智能体...] + backOption + mainMenuOption       │
  │  ├─ Cancel / back / mainMenu ──► return (→S1)                   │
  │  └─ agentId ──► 查找 agent 定义                                 │
  │        ├─ multiProvider=true  ──► S3-MP                         │
  │        └─ multiProvider=false ──► S3-SP                         │
  │                                                                 │
  │  ┌─── S3-SP: 单供应商模式 ─────────────────────────────────┐    │
  │  │  每次循环: displayAgentConfig()                          │    │
  │  │    - 配置目录、接口地址、API 类型、API Key(掩码)          │    │
  │  │    - 各模型槽位当前值                                    │    │
  │  │                                                         │    │
  │  │  选项:                                                  │    │
  │  │  [设置模型供应商] ──► S4                                 │    │
  │  │  [设置模型]       ──► S5                                 │    │
  │  │  backOption / Cancel ──► return (→S2)                    │    │
  │  │  mainMenuOption ──► return (→S1)                         │    │
  │  │                                                         │    │
  │  │  导航协议:                                               │    │
  │  │    S4/S5 返回 true  ──► 直接 return 到 S1               │    │
  │  │    S4/S5 返回 false ──► 继续 S3-SP 循环                 │    │
  │  └─────────────────────────────────────────────────────────┘    │
  │                                                                 │
  │  ┌─── S3-MP: 多供应商模式 ─────────────────────────────────┐    │
  │  │  每次循环: displayMultiProviderConfig()                  │    │
  │  │    - 配置目录、API 类型                                  │    │
  │  │    - 已绑定供应商列表（名称 + Key 掩码或"继承默认"）      │    │
  │  │                                                         │    │
  │  │  选项:                                                  │    │
  │  │  [添加供应商] ──► S6                                    │    │
  │  │  [移除供应商] ──► S7                                    │    │
  │  │  backOption / Cancel ──► return (→S2)                    │    │
  │  │  mainMenuOption ──► return (→S1)                         │    │
  │  └─────────────────────────────────────────────────────────┘    │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘


  ┌─── S4: 选择供应商 ─────────────────────────────────────────────┐
  │                                                                 │
  │  前置检查: 过滤 config.providers 中 apiType 兼容的供应商        │
  │                                                                 │
  │  IF 无兼容供应商:                                               │
  │    log.warn → confirm('是否立即添加？')                          │
  │    ├─ No / Cancel ──► return false                              │
  │    └─ Yes ──► handleAddProvider(config) (→P2)                   │
  │              重新过滤，仍无 ──► return false                     │
  │              有 ──► 继续下方 select                              │
  │                                                                 │
  │  select('切换到：'):                                            │
  │    [兼容供应商...] + backOption + mainMenuOption                │
  │    ├─ Cancel / back ──► return false                            │
  │    ├─ mainMenu ──► return true                                  │
  │    └─ providerId ──► confirm('确认切换？')                       │
  │         ├─ No / Cancel ──► return false                         │
  │         └─ Yes:                                                 │
  │           1. 保存当前 modelSlots 到 history[oldProvider]        │
  │           2. currentProvider = newProviderId                    │
  │           3. modelSlots = history[newProviderId] ?? {}          │
  │           4. agent.saveNativeConfig({baseUrl, apiKey, models}) │
  │           5. saveConfig(config)                                 │
  │           6. log.success                                        │
  │                                                                 │
  │  后置检查: modelSlots 为空 且 agent.models 非空?                 │
  │    confirm('尚未配置模型，是否立即设置？')                       │
  │    ├─ Yes ──► handleChooseModel (→S5)                           │
  │    │         S5 返回 true ──► return true                       │
  │    └─ No / Cancel ──► return false                              │
  │                                                                 │
  │  return false (留在 S3-SP 循环)                                 │
  └─────────────────────────────────────────────────────────────────┘


  ┌─── S5: 选择模型 ───────────────────────────────────────────────┐
  │                                                                 │
  │  前置检查: 无 currentProvider?                                   │
  │    log.warn → confirm('是否立即设置？')                          │
  │    ├─ No / Cancel ──► return false                              │
  │    └─ Yes ──► handleChooseProvider (→S4)                        │
  │              S4 返回 true ──► return true                       │
  │              重新检查仍无 provider ──► return false              │
  │                                                                 │
  │  查找 provider，不存在 ──► log.error → return false             │
  │                                                                 │
  │  构建选项: provider.models + { value:'__manual__', label:'手动输入' } │
  │                                                                 │
  │  FOR EACH slot IN agent.models:                                 │
  │    select('<slot.name> (<slot.slot>)'):                         │
  │    ├─ Cancel ──► return false                                   │
  │    ├─ '__manual__':                                             │
  │    │   text('输入 <name> 的模型 ID')                            │
  │    │   ├─ Cancel ──► return false                               │
  │    │   └─ value ──► modelId                                     │
  │    └─ modelId ──► 记录分配                                      │
  │                                                                 │
  │  全部槽位完成后:                                                 │
  │    1. agentAssignment.modelSlots = {slot→id}                    │
  │    2. agent.saveNativeConfig({baseUrl, apiKey, models})         │
  │    3. saveConfig(config)                                        │
  │    4. log.success                                               │
  │                                                                 │
  │  return false (留在 S3-SP 循环)                                 │
  └─────────────────────────────────────────────────────────────────┘


  ┌─── S6: 添加供应商绑定 ─────────────────────────────────────────┐
  │                                                                 │
  │  过滤条件:                                                      │
  │    - endpoints 匹配 agent.apiType                               │
  │    - 不在已绑定 provider ID 集合中                               │
  │    - baseUrl 不在已绑定 baseUrl 集合中                           │
  │                                                                 │
  │  IF 无兼容供应商:                                               │
  │    log.warn → confirm('是否先去添加？')                          │
  │    ├─ No / Cancel ──► return                                    │
  │    └─ Yes ──► handleAddProvider(config) (→P2) ──► return        │
  │                                                                 │
  │  select('选择要绑定的供应商：')                                   │
  │    ├─ Cancel ──► return                                         │
  │    └─ providerId ──► confirm('确认绑定？')                       │
  │         ├─ No / Cancel ──► return                               │
  │         └─ Yes:                                                 │
  │           1. 初始化 config.agents[id] (如不存在)                 │
  │           2. 初始化 agents[id].providers (如不存在)              │
  │           3. agents[id].providers[providerId] = {}              │
  │           4. syncMultiProviderNativeConfig()                    │
  │           5. saveConfig(config)                                 │
  │           6. log.success                                        │
  │           失败: delete binding → log.error                      │
  │                                                                 │
  │  return (回到 S3-MP 循环)                                       │
  └─────────────────────────────────────────────────────────────────┘


  ┌─── S7: 移除供应商绑定 ─────────────────────────────────────────┐
  │                                                                 │
  │  IF 无绑定: log.warn → return                                   │
  │                                                                 │
  │  select('选择要移除的供应商：')                                   │
  │    [绑定列表...] + backOption + mainMenuOption                  │
  │    ├─ Cancel / back / mainMenu ──► return                       │
  │    └─ targetId ──► confirm('确认移除？')                         │
  │         ├─ No / Cancel ──► return                               │
  │         └─ Yes:                                                 │
  │           1. backup = bindings[targetId]                        │
  │           2. delete bindings[targetId]                          │
  │           3. syncMultiProviderNativeConfig()                    │
  │           4. saveConfig(config)                                 │
  │           5. log.success                                        │
  │           失败: bindings[targetId] = backup → log.error         │
  │                                                                 │
  │  return (回到 S3-MP 循环)                                       │
  └─────────────────────────────────────────────────────────────────┘


  ┌─── Provider Path ──────────────────────────────────────────────┐
  │                                                                 │
  │  P1: 供应商选择                                                  │
  │  ├─ 选项: [已有供应商...] + '添加模型供应商' + back + mainMenu  │
  │  ├─ Cancel / back ──► return (→S1)                              │
  │  ├─ mainMenu ──► return (→S1)                                   │
  │  ├─ 'addProvider' ──► P2                                        │
  │  └─ providerId ──► P3                                           │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘


  ┌─── P2: 添加供应商 ─────────────────────────────────────────────┐
  │                                                                 │
  │  select('选择模型供应商'):                                       │
  │    [预设列表...] + '自定义模型供应商' + back + mainMenu          │
  │    ├─ Cancel / back ──► return                                  │
  │    ├─ mainMenu ──► return                                       │
  │    ├─ 'custom' ──► P2c                                          │
  │    └─ presetId ──► P2p                                          │
  │                                                                 │
  │  注意: 此函数也被 S4a 和 S6a 跨子系统调用                       │
  └─────────────────────────────────────────────────────────────────┘


  ┌─── P2p: 添加预设供应商 ────────────────────────────────────────┐
  │                                                                 │
  │  IF preset.pricing 多于 1 个:                                   │
  │    select('选择付费模式'):                                       │
  │    ├─ Cancel / 'back' ──► return                                │
  │    └─ pricingId                                                 │
  │                                                                 │
  │  password('输入 API Key'):                                      │
  │    ├─ Cancel ──► return                                         │
  │    └─ apiKey ──► addProvider(config, presetId, apiKey, pricingId)│
  │                  log.success                                    │
  │                  失败: log.error                                 │
  │                                                                 │
  │  return                                                         │
  └─────────────────────────────────────────────────────────────────┘


  ┌─── P2c: 添加自定义供应商 ──────────────────────────────────────┐
  │                                                                 │
  │  多步顺序表单（每步可独立 Cancel → return）:                     │
  │  1. text('输入供应商名称')                                      │
  │  2. multiselect('选择 API 类型') [openai, anthropic, google]    │
  │  3. FOR EACH apiType: text('输入 Base URL')                     │
  │  4. password('输入 API Key')                                    │
  │                                                                 │
  │  创建 Provider { UUID, name, apiKey, endpoints, models:[] }    │
  │  config.providers.push → saveConfig → log.success               │
  │  失败: config.providers.pop → log.error                         │
  │                                                                 │
  │  return                                                         │
  └─────────────────────────────────────────────────────────────────┘


  ┌─── P3: 修改供应商 ─────────────────────────────────────────────┐
  │                                                                 │
  │  每次循环: 检查 isUsed = 是否有 agent 绑定此供应商              │
  │                                                                 │
  │  select('设置 <name>'):                                         │
  │  [设置模型] ──► P4                                              │
  │  [设置 API Key] ──► P5                                          │
  │  [清除 API Key] ──► P6                                          │
  │  [删除此模型供应商] ──► P7 (disabled if isUsed, hint: '正在被使用') │
  │  backOption / Cancel ──► return (→P1)                           │
  │  mainMenuOption ──► return (→S1)                                │
  │                                                                 │
  │  导航协议:                                                      │
  │    P4 返回 true  ──► return (→S1)                               │
  │    P7 返回 true  ──► return (→P1, 供应商已删除)                  │
  │    false / void  ──► 继续 P3 循环                               │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘


  ┌─── P4: 设置模型 ───────────────────────────────────────────────┐
  │                                                                 │
  │  select('选择操作'):                                            │
  │  [从 API 获取模型列表] ──► P4a                                  │
  │  [手动添加模型]       ──► P4b                                   │
  │  [清空模型列表]       ──► P4c                                   │
  │  backOption / Cancel  ──► return false                          │
  │  mainMenuOption       ──► return true                           │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘


  ┌─── P4a: 从 API 获取模型 ───────────────────────────────────────┐
  │                                                                 │
  │  前置: 按 provider.name 查找 preset                             │
  │    无 preset 或无 fetchModels ──► log.warn → return false       │
  │  前置: provider.endpoints 存在?                                  │
  │    无 ──► log.error → return false                              │
  │                                                                 │
  │  log.info('正在获取...')                                        │
  │  preset.fetchModels(type, baseUrl, apiKey)                      │
  │    成功: provider.models = fetched → saveConfig → log.success   │
  │    失败: log.error                                              │
  │                                                                 │
  │  return false (回到 P3 循环)                                    │
  └─────────────────────────────────────────────────────────────────┘


  ┌─── P4b: 手动添加模型 ──────────────────────────────────────────┐
  │                                                                 │
  │  1. text('输入模型 ID')  ── Cancel → return false               │
  │  2. text('输入模型显示名称') ── Cancel → return false            │
  │                                                                 │
  │  provider.models.push({ id, name, contextWindowSize: 256000 }) │
  │  saveConfig → log.success                                       │
  │  失败: provider.models.pop → log.error                          │
  │                                                                 │
  │  return false                                                   │
  └─────────────────────────────────────────────────────────────────┘


  ┌─── P4c: 清空模型列表 ──────────────────────────────────────────┐
  │                                                                 │
  │  confirm('确认清空？')                                          │
  │    No / Cancel ──► return false                                 │
  │    Yes: backup = provider.models                                │
  │          provider.models = []                                   │
  │          saveConfig → log.success                               │
  │          失败: provider.models = backup → log.error             │
  │                                                                 │
  │  return false                                                   │
  └─────────────────────────────────────────────────────────────────┘


  ┌─── P5: 设置 API Key ───────────────────────────────────────────┐
  │                                                                 │
  │  password('输入 API Key'):                                      │
  │    Cancel ──► return                                            │
  │    value: provider.apiKey = value → saveConfig → log.success    │
  │                                                                 │
  │  return (回到 P3 循环)                                          │
  └─────────────────────────────────────────────────────────────────┘


  ┌─── P6: 清除 API Key ───────────────────────────────────────────┐
  │                                                                 │
  │  confirm('确认清除？'):                                         │
  │    No / Cancel ──► return                                       │
  │    Yes: provider.apiKey = '' → saveConfig → log.success         │
  │                                                                 │
  │  return (回到 P3 循环)                                          │
  └─────────────────────────────────────────────────────────────────┘


  ┌─── P7: 删除供应商 ─────────────────────────────────────────────┐
  │                                                                 │
  │  confirm('确认删除？此操作不可撤销。'):                          │
  │    No / Cancel ──► return false                                 │
  │    Yes:                                                          │
  │      级联清理:                                                   │
  │        FOR EACH agent IN config.agents:                         │
  │          if agent.currentProvider === provider.id:              │
  │            agent.currentProvider = ''                           │
  │            agent.modelSlots = {}                                │
  │            agent.saveNativeConfig({clear all})                  │
  │          delete agent.history[provider.id]                      │
  │                                                                 │
  │      config.providers.splice(idx, 1)                            │
  │      saveConfig → log.success → return true                     │
  │      失败: splice 回插 → log.error → return false               │
  │                                                                 │
  │  return true  → P3 退出（供应商已不存在）                        │
  │  return false → 留在 P3 循环                                    │
  └─────────────────────────────────────────────────────────────────┘
```

---

## 4. 完整转换表

| 来源状态 | 用户操作 | 条件 | 目标状态 | 方向 |
|----------|----------|------|----------|------|
| S0 | (自动) | always | S1 | forward |
| S1 | `'智能体'` | always | S2 | forward |
| S1 | `'模型供应商'` | always | P1 | forward |
| S1 | `'查看当前设置'` | always | S0 | refresh |
| S1 | `'退出'` / Cancel | always | END | exit |
| S2 | agentId | `multiProvider=true` | S3-MP | forward |
| S2 | agentId | `multiProvider=false` | S3-SP | forward |
| S2 | back / Cancel | always | S1 | back |
| S2 | mainMenu | always | S1 | back |
| S3-SP | `'设置模型供应商'` | (见 S4) | S4 | forward |
| S3-SP | `'设置模型'` | (见 S5) | S5 | forward |
| S3-SP | back / Cancel | always | S2 | back |
| S3-SP | mainMenu | always | S1 | back |
| S4 | 供应商已选 + 确认 | 成功 | S3-SP (循环) 或 S4b | loop |
| S4 | mainMenu | always | S1 | back |
| S4 | back / Cancel | always | S3-SP | back |
| S4 | 无兼容 → 添加 → 仍无 | always | S3-SP (loop) | back |
| S4 | 切换后无模型 → `'立即设置'` → Yes | confirmed | S5 | forward |
| S5 | 无 provider → `'立即设置'` → Yes | confirmed | S4 | forward |
| S5 | 全部槽位完成 | always | S3-SP (loop) | loop |
| S5 | 任意 Cancel | always | S3-SP (loop) | loop |
| S5 | mainMenu (via S4) | S4 返回 true | S1 | back |
| S3-MP | `'添加供应商'` | always | S6 | forward |
| S3-MP | `'移除供应商'` | always | S7 | forward |
| S3-MP | back / Cancel | always | S2 | back |
| S3-MP | mainMenu | always | S1 | back |
| S6 | 确认绑定 | 成功 | S3-MP (loop) | loop |
| S6 | 无兼容 → `'先去添加'` → Yes | always | P2 (跨子系统) | cross |
| S6 | Cancel / No | always | S3-MP (loop) | loop |
| S7 | 确认移除 | 成功 | S3-MP (loop) | loop |
| S7 | Cancel / No | always | S3-MP (loop) | loop |
| P1 | `'添加模型供应商'` | always | P2 | forward |
| P1 | providerId | always | P3 | forward |
| P1 | back / Cancel | always | S1 | back |
| P1 | mainMenu | always | S1 | back |
| P2 | presetId | always | P2p | forward |
| P2 | `'自定义'` | always | P2c | forward |
| P2 | back / Cancel | always | P1 (或调用者) | back |
| P2 | mainMenu | always | S1 | back |
| P2p | 完成 | success | P1 (return) | back |
| P2p | Cancel | always | P2 (return) | back |
| P2c | 完成 | success | P1 (return) | back |
| P2c | Cancel | always | P2 (return) | back |
| P3 | `'设置模型'` | (见 P4) | P4 | forward |
| P3 | `'设置 API Key'` | always | P5 | forward |
| P3 | `'清除 API Key'` | always | P6 | forward |
| P3 | `'删除此模型供应商'` | `isUsed=false` | P7 | forward |
| P3 | `'删除此模型供应商'` | `isUsed=true` | P3 (disabled) | stay |
| P3 | back / Cancel | always | P1 | back |
| P3 | mainMenu | always | S1 | back |
| P4 | `'从 API 获取'` | preset 有 fetchModels | P4a | forward |
| P4 | `'从 API 获取'` | 无 fetchModels | P4 (warn + loop) | stay |
| P4 | `'手动添加'` | always | P4b | forward |
| P4 | `'清空'` | always | P4c | forward |
| P4 | mainMenu | always | S1 | back |
| P4 | back / Cancel | always | P3 (loop) | back |
| P4a/P4b/P4c | 完成 | always | P3 (loop) | loop |
| P5 | password 输入 | success | P3 (loop) | loop |
| P5 | Cancel | always | P3 (loop) | loop |
| P6 | 确认 | success | P3 (loop) | loop |
| P6 | Cancel / No | always | P3 (loop) | loop |
| P7 | 确认 + 保存 | success | P1 (供应商已删除) | back |
| P7 | Cancel / No | always | P3 (loop) | loop |

---

## 5. 数据流

### 5.1 共享可变状态

整个系统操作一个启动时加载的内存 `AgentBatonConfig` 对象，所有变更原地发生：

```
config: AgentBatonConfig
├── config.providers: Provider[]
│   └── 被 P2/P2p/P2c/P4/P5/P6/P7 修改
└── config.agents[id]: Agent
    ├── .currentProvider: string     ← S4 设置
    ├── .modelSlots: Record<slot,id> ← S4(从 history 恢复) / S5 设置
    ├── .history: Record<provId,slots> ← S4(切换前保存)
    └── .providers: Record<provId,{}>  ← S6 添加 / S7 删除
```

### 5.2 History 机制（单供应商模式）

切换供应商时的模型槽位记忆：

```
从供应商 A 切换到 B 时:
  1. history[A] = { ...当前 modelSlots }   // 保存 A 的配置
  2. currentProvider = B
  3. modelSlots = history[B] ?? {}          // 恢复 B 的历史配置（如有）

效果: 用户在 A/B 之间反复切换时，各自的模型配置不会丢失。
```

### 5.3 syncMultiProviderNativeConfig（多供应商模式）

将 agentbaton 的绑定关系合并写入智能体原生配置文件：

```
读取现有原生 config → providers 字段
FOR EACH binding IN config.agents[id].providers:
  合并: {
    apiKey: binding.apiKey ?? provider.apiKey,    // 绑定级覆盖 > 供应商默认
    baseUrl: binding.baseUrl ?? endpoint.baseUrl,
    models: provider.models
  }
agent.saveNativeConfig({ providers: mergedProviders })
```

### 5.4 外部 I/O 点

| 状态 | 读取 | 写入 |
|------|------|------|
| S0 (displayInfo) | `isCommandAvailable` (shell which/where) | — |
| S3-SP (displayAgentConfig) | `agent.loadNativeConfig()` | — |
| S3-MP (displayMultiProviderConfig) | `agent.loadNativeConfig()` | — |
| S4 (chooseProvider) | — | `agent.saveNativeConfig()`, `saveConfig()` |
| S5 (chooseModel) | — | `agent.saveNativeConfig()`, `saveConfig()` |
| S6 (addBinding) | `agent.loadNativeConfig()` | `agent.saveNativeConfig()`, `saveConfig()` |
| S7 (removeBinding) | `agent.loadNativeConfig()` | `agent.saveNativeConfig()`, `saveConfig()` |
| P2p (addPreset) | — | `saveConfig()` |
| P2c (addCustom) | — | `saveConfig()` |
| P4a (fetchModels) | `preset.fetchModels()` (HTTP) | `saveConfig()` |
| P4b (addModel) | — | `saveConfig()` |
| P4c (clearModels) | — | `saveConfig()` |
| P5 (setApiKey) | — | `saveConfig()` |
| P6 (cleanApiKey) | — | `saveConfig()` |
| P7 (deleteProvider) | — | `agent.saveNativeConfig()`, `saveConfig()` |

---

## 6. 跨子系统跳转

Agent 路径中有两处跳入 Provider 路径：

| 来源 | 触发条件 | 跳转目标 | 返回后行为 |
|------|----------|----------|------------|
| S4 (handleChooseProvider) | 无兼容供应商 → 用户确认添加 | P2 (handleAddProvider) | 重新过滤兼容供应商 |
| S6 (handleAddProviderBinding) | 无可绑定供应商 → 用户确认添加 | P2 (handleAddProvider) | 返回 S3-MP 循环 |

两处都通过 `handleAddProvider(config)` 调用，`config` 对象原地修改，调用方自动看到新添加的供应商。

---

## 7. 循环汇总

| 状态 | 循环类型 | 退出条件 |
|------|----------|----------|
| S1 (主菜单) | `while(true)` | `'exit'` 或 `isCancel` |
| S3-SP (单供应商菜单) | `while(true)` | backOption / mainMenuOption / isCancel |
| S3-MP (多供应商菜单) | `while(true)` | backOption / mainMenuOption / isCancel |
| P3 (修改供应商) | `while(true)` | backOption / mainMenuOption / isCancel / handleDeleteProvider 返回 true |
| S5 (选择模型) | `for (slot of agent.models)` | 全部槽位处理完毕或任意 isCancel |

其余状态均为线性执行（无循环）。

---

## 8. 错误处理模式

所有状态遵循统一的 try/catch 模式：

```typescript
try {
  // 执行操作
  await saveConfig(config);
  log.success('...');
} catch (e) {
  // 回滚内存变更（如有）
  log.error(`操作失败：${e instanceof Error ? e.message : String(e)}`);
}
```

需要回滚的操作：
- P2c: `config.providers.pop()`
- P4b: `provider.models.pop()`
- P4c: `provider.models = backup`
- S6: `delete agentEntry.providers[providerId]`
- S7: `bindings[targetId] = backup`
- P7: `config.providers.splice(idx, 0, provider)`
