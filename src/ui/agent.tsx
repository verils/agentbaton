import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { SelectMenu } from './components/select-menu.js';
import { TextInput } from './components/text-input.js';
import type { AgentBatonConfig, AgentDefinition, AgentModel } from '../types/index.js';
import { findAgent } from '../agent/builtin.js';
import { resolvePlatformHome, maskApiKey } from '../utils/index.js';
import { saveConfig } from '../config/index.js';

type NavProps = {
  navigate: (screen: any) => void;
  goBack: () => void;
  goToMainMenu: () => void;
  exit: () => void;
};

function getCurrentModel(models: AgentModel[] | undefined, slot: string): string | null {
  return models?.find(m => m.slot === slot)?.id ?? null;
}

export function AgentDetailScreen({ agentId, config, nav }: {
  agentId: string;
  config: AgentBatonConfig;
  nav: NavProps;
}) {
  const agent = findAgent(agentId);
  if (!agent) {
    return (
      <Box flexDirection="column">
        <Text color="red">智能体不存在</Text>
        <SelectMenu message="" options={[
          { value: '__back__', label: '↑ 返回上一级菜单' },
          { value: '__main_menu__', label: '↩ 返回主菜单' },
        ]} onSubmit={v => v === '__main_menu__' ? nav.goToMainMenu() : nav.goBack()} />
      </Box>
    );
  }
  if (agent.multiProvider) {
    return <MultiProviderAgentMenu agentId={agentId} config={config} nav={nav} />;
  }
  return <SingleProviderAgentMenu agentId={agentId} config={config} nav={nav} />;
}

// ─── S3-SP: 单供应商模式 ───

function SingleProviderAgentMenu({ agentId, config, nav }: {
  agentId: string;
  config: AgentBatonConfig;
  nav: NavProps;
}) {
  const agent = findAgent(agentId)!;
  const agentEntry = config.agents[agentId];
  const configPath = agent.home ? resolvePlatformHome(agent.home) : '(未配置)';
  const providerName = agentEntry?.currentProvider
    ? config.providers.find(p => p.id === agentEntry.currentProvider)?.name
    : undefined;

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" paddingLeft={1} borderStyle="round" borderColor="gray" marginBottom={1}>
        <Text color="gray">配置目录: {configPath}</Text>
        <Text color="gray">API 类型: {agent.apiType}</Text>
        {providerName && <Text color="gray">当前供应商: {providerName}</Text>}
        <Box flexDirection="column" marginTop={1}>
          <Text>模型：</Text>
          {agent.models.map(slot => {
            const modelId = agentEntry?.modelSlots?.[slot.slot];
            return <Text key={slot.slot} color="gray">  {slot.name}：{modelId ?? '（获取失败）'}</Text>;
          })}
        </Box>
      </Box>
      <SelectMenu message={`${agent.name}：`} options={[
        { value: 'chooseProvider', label: '设置模型供应商' },
        { value: 'chooseModel', label: '设置模型' },
        { value: '__back__', label: '↑ 返回上一级菜单' },
        { value: '__main_menu__', label: '↩ 返回主菜单' },
      ]} onSubmit={value => {
        if (value === '__back__') { nav.goBack(); return; }
        if (value === '__main_menu__') { nav.goToMainMenu(); return; }
        if (value === 'chooseProvider') {
          nav.navigate({ type: 'chooseProvider', agentId });
        } else if (value === 'chooseModel') {
          nav.navigate({ type: 'chooseModel', agentId });
        }
      }} />
    </Box>
  );
}

// ─── S4: 选择供应商 ───

export function ChooseProviderScreen({ agentId, config, nav }: {
  agentId: string;
  config: AgentBatonConfig;
  nav: NavProps;
}) {
  const agent = findAgent(agentId)!;
  const compatible = config.providers.filter(p => p.endpoints.some(e => e.type === agent.apiType));
  const [noProviders, setNoProviders] = useState(compatible.length === 0);
  const [justAdded, setJustAdded] = useState(false);

  if (noProviders && !justAdded) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">没有兼容 {agent.apiType} 类型的供应商</Text>
        <SelectMenu message="是否立即添加？" options={[
          { value: 'yes', label: '是，去添加' },
          { value: 'no', label: '否，返回' },
        ]} onSubmit={value => {
          if (value === 'yes') {
            nav.navigate({ type: 'addProvider', returnTo: { type: 'chooseProvider', agentId } });
          } else {
            nav.goBack();
          }
        }} />
      </Box>
    );
  }

  const providers = justAdded
    ? config.providers.filter(p => p.endpoints.some(e => e.type === agent.apiType))
    : compatible;

  return (
    <Box flexDirection="column">
      <SelectMenu message="切换到：" options={[
        ...providers.map(p => ({ value: p.id, label: p.name })),
        { value: '__back__', label: '↑ 返回上一级菜单' },
        { value: '__main_menu__', label: '↩ 返回主菜单' },
      ]} onSubmit={value => {
        if (value === '__back__') { nav.goBack(); return; }
        if (value === '__main_menu__') { nav.goToMainMenu(); return; }
        nav.navigate({ type: 'confirmProviderSwitch', agentId, providerId: value });
      }} />
    </Box>
  );
}

export function ConfirmProviderSwitchScreen({ agentId, providerId, config, nav }: {
  agentId: string;
  providerId: string;
  config: AgentBatonConfig;
  nav: NavProps;
}) {
  const agent = findAgent(agentId)!;
  const provider = config.providers.find(p => p.id === providerId)!;

  return (
    <Box flexDirection="column">
      <Text>切换 {agent.name} 的供应商到 {provider.name}？</Text>
      <SelectMenu message="" options={[
        { value: 'yes', label: '确认切换' },
        { value: 'no', label: '取消' },
      ]} onSubmit={async value => {
        if (value === 'no') { nav.goBack(); return; }

        const agentEntry = config.agents[agentId] ?? { id: agentId, currentProvider: '', modelSlots: {} };

        if (agentEntry.currentProvider && Object.keys(agentEntry.modelSlots).length > 0) {
          if (!agentEntry.history) { agentEntry.history = {}; }
          agentEntry.history[agentEntry.currentProvider] = { ...agentEntry.modelSlots };
        }

        agentEntry.currentProvider = providerId;
        agentEntry.modelSlots = agentEntry.history?.[providerId] ? { ...agentEntry.history[providerId] } : {};
        config.agents[agentId] = agentEntry;

        try {
          const models: AgentModel[] = Object.entries(agentEntry.modelSlots).map(([slot, id]) => ({ slot, id }));
          await agent.saveNativeConfig({
            baseUrl: provider.endpoints.find(e => e.type === agent.apiType)?.baseUrl,
            apiKey: provider.apiKey,
            models,
          });
          await saveConfig(config);

          if (Object.keys(agentEntry.modelSlots).length === 0 && agent.models.length > 0) {
            nav.navigate({ type: 'promptChooseModel', agentId });
          } else {
            nav.navigate({ type: 'agentDetail', agentId });
          }
        } catch (e) {
          nav.navigate({ type: 'agentDetail', agentId });
        }
      }} />
    </Box>
  );
}

export function PromptChooseModelScreen({ agentId, nav }: {
  agentId: string;
  nav: NavProps;
}) {
  return (
    <Box flexDirection="column">
      <Text color="yellow">当前供应商尚未配置模型</Text>
      <SelectMenu message="是否立即设置？" options={[
        { value: 'yes', label: '是' },
        { value: 'no', label: '否，返回' },
      ]} onSubmit={value => {
        if (value === 'yes') {
          nav.navigate({ type: 'chooseModel', agentId });
        } else {
          nav.navigate({ type: 'agentDetail', agentId });
        }
      }} />
    </Box>
  );
}

// ─── S5: 选择模型 ───

export function ChooseModelScreen({ agentId, config, nav }: {
  agentId: string;
  config: AgentBatonConfig;
  nav: NavProps;
}) {
  const agent = findAgent(agentId)!;
  const agentEntry = config.agents[agentId];
  const [slotIndex, setSlotIndex] = useState(0);
  const [assignments, setAssignments] = useState<AgentModel[]>([]);
  const [noProvider, setNoProvider] = useState(!agentEntry?.currentProvider);
  const [showManual, setShowManual] = useState(false);
  const [done, setDone] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (noProvider) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">尚未设置模型供应商</Text>
        <SelectMenu message="是否立即设置？" options={[
          { value: 'yes', label: '是' },
          { value: 'no', label: '否，返回' },
        ]} onSubmit={value => {
          if (value === 'yes') {
            nav.navigate({ type: 'chooseProvider', agentId });
          } else {
            nav.goBack();
          }
        }} />
      </Box>
    );
  }

  const provider = config.providers.find(p => p.id === agentEntry!.currentProvider);
  if (!provider) {
    return (
      <Box flexDirection="column">
        <Text color="red">当前绑定的供应商不存在，请重新设置</Text>
        <SelectMenu message="" options={[
          { value: 'back', label: '返回' },
        ]} onSubmit={() => nav.goBack()} />
      </Box>
    );
  }

  if (done) {
    return (
      <Box flexDirection="column">
        <Text color={saveError ? 'red' : 'green'}>
          {saveError ? `保存失败：${saveError}` : '✅ 模型已更新'}
        </Text>
        <SelectMenu message="" options={[
          { value: 'back', label: '返回' },
        ]} onSubmit={() => nav.navigate({ type: 'agentDetail', agentId })} />
      </Box>
    );
  }

  const currentSlot = agent.models[slotIndex];

  if (showManual) {
    return <TextInput
      promptMessage={`输入 ${currentSlot.name} 的模型 ID`}
      placeholder="例如: gpt-4o"
      onSubmit={modelId => {
        const next = [...assignments, { slot: currentSlot.slot, id: modelId }];
        if (slotIndex + 1 >= agent.models.length) {
          finishModelAssignment(agent, agentEntry!, provider, next, config, nav, agentId, setDone, setSaveError);
        } else {
          setAssignments(next);
          setSlotIndex(slotIndex + 1);
          setShowManual(false);
        }
      }}
      onCancel={() => setShowManual(false)}
    />;
  }

  const modelOptions = [
    ...provider.models.map(m => ({ value: m.id, label: m.name })),
    { value: '__manual__', label: '手动输入' },
  ];

  return (
    <Box flexDirection="column">
      <Text color="gray">({slotIndex + 1}/{agent.models.length})</Text>
      <SelectMenu message={`${currentSlot.name} (${currentSlot.slot})`} options={modelOptions} onSubmit={value => {
        if (value === '__manual__') {
          setShowManual(true);
        } else {
          const next = [...assignments, { slot: currentSlot.slot, id: value }];
          if (slotIndex + 1 >= agent.models.length) {
            finishModelAssignment(agent, agentEntry!, provider, next, config, nav, agentId, setDone, setSaveError);
          } else {
            setAssignments(next);
            setSlotIndex(slotIndex + 1);
          }
        }
      }} />
    </Box>
  );
}

async function finishModelAssignment(
  agent: AgentDefinition,
  agentEntry: { currentProvider: string; modelSlots: Record<string, string> },
  provider: { endpoints: Array<{ type: string; baseUrl: string }>; apiKey: string },
  assignments: AgentModel[],
  config: AgentBatonConfig,
  nav: NavProps,
  agentId: string,
  setDone: (v: boolean) => void,
  setSaveError: (v: string | null) => void,
) {
  agentEntry.modelSlots = Object.fromEntries(assignments.map(m => [m.slot, m.id]));
  try {
    await agent.saveNativeConfig({
      baseUrl: provider.endpoints.find(e => e.type === agent.apiType)?.baseUrl,
      apiKey: provider.apiKey,
      models: assignments,
    });
    await saveConfig(config);
    setDone(true);
  } catch (e) {
    setSaveError(e instanceof Error ? e.message : String(e));
    setDone(true);
  }
}

// ─── S3-MP: 多供应商模式 ───

function MultiProviderAgentMenu({ agentId, config, nav }: {
  agentId: string;
  config: AgentBatonConfig;
  nav: NavProps;
}) {
  const agent = findAgent(agentId)!;
  const configPath = agent.home ? resolvePlatformHome(agent.home) : '(未配置)';
  const bindings = config.agents[agentId]?.providers ?? {};
  const entries = Object.entries(bindings);

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" paddingLeft={1} borderStyle="round" borderColor="gray" marginBottom={1}>
        <Text color="gray">配置目录: {configPath}</Text>
        <Text color="gray">API 类型: {agent.apiType}</Text>
        <Text>已绑定供应商：</Text>
        {entries.length === 0 ? (
          <Text color="gray">  （暂无绑定）</Text>
        ) : entries.map(([key, binding]) => {
          const p = config.providers.find(pp => pp.id === key);
          const name = p?.name ?? key;
          const keyDisplay = binding.apiKey ? maskApiKey(binding.apiKey) : '(继承默认)';
          return <Text key={key} color="gray">  {name}  Key: {keyDisplay}</Text>;
        })}
      </Box>
      <SelectMenu message={`${agent.name}：`} options={[
        { value: 'add', label: '添加供应商' },
        { value: 'remove', label: '移除供应商' },
        { value: '__back__', label: '↑ 返回上一级菜单' },
        { value: '__main_menu__', label: '↩ 返回主菜单' },
      ]} onSubmit={value => {
        if (value === '__back__') { nav.goBack(); return; }
        if (value === '__main_menu__') { nav.goToMainMenu(); return; }
        if (value === 'add') {
          nav.navigate({ type: 'addProviderBinding', agentId });
        } else {
          nav.navigate({ type: 'removeProviderBinding', agentId });
        }
      }} />
    </Box>
  );
}

// ─── S6: 添加供应商绑定 ───

export function AddProviderBindingScreen({ agentId, config, nav }: {
  agentId: string;
  config: AgentBatonConfig;
  nav: NavProps;
}) {
  const agent = findAgent(agentId)!;
  const boundIds = new Set(Object.keys(config.agents[agentId]?.providers ?? {}));

  const [step, setStep] = useState<'select' | 'confirm' | 'done'>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [doneError, setDoneError] = useState(false);

  const compatible = config.providers
    .filter(p => p.endpoints.some(e => e.type === agent.apiType))
    .filter(p => !boundIds.has(p.id));

  if (step === 'done') {
    return (
      <Box flexDirection="column">
        <Text color={doneError ? 'red' : 'green'}>{doneMsg}</Text>
        <SelectMenu message="" options={[
          { value: 'back', label: '返回' },
        ]} onSubmit={() => nav.navigate({ type: 'agentDetail', agentId })} />
      </Box>
    );
  }

  if (step === 'confirm' && selectedId) {
    const provider = config.providers.find(p => p.id === selectedId)!;
    return (
      <Box flexDirection="column">
        <Text>确认绑定 {provider.name} 到 {agent.name}？</Text>
        <SelectMenu message="" options={[
          { value: 'yes', label: '确认绑定' },
          { value: 'no', label: '取消' },
        ]} onSubmit={async value => {
          if (value === 'no') { nav.goBack(); return; }

          if (!config.agents[agentId]) {
            config.agents[agentId] = { id: agentId, currentProvider: '', modelSlots: {} };
          }
          const agentEntry = config.agents[agentId];
          if (!agentEntry.providers) { agentEntry.providers = {}; }
          agentEntry.providers[selectedId] = {};

          try {
            await syncMultiProviderNativeConfig(agent, config);
            await saveConfig(config);
            setDoneMsg(`✅ ${agent.name} 已绑定 ${provider.name}`);
            setDoneError(false);
          } catch (e) {
            delete agentEntry.providers[selectedId];
            setDoneMsg(`绑定失败：${e instanceof Error ? e.message : String(e)}`);
            setDoneError(true);
          }
          setStep('done');
        }} />
      </Box>
    );
  }

  if (compatible.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">没有更多可添加的兼容 {agent.apiType} 类型供应商</Text>
        <SelectMenu message="是否先去添加新供应商？" options={[
          { value: 'yes', label: '是，去添加' },
          { value: 'no', label: '否，返回' },
        ]} onSubmit={value => {
          if (value === 'yes') {
            nav.navigate({ type: 'addProvider', returnTo: { type: 'agentDetail', agentId } });
          } else {
            nav.goBack();
          }
        }} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <SelectMenu message="选择要绑定的供应商：" options={[
        ...compatible.map(p => ({ value: p.id, label: p.name })),
        { value: '__back__', label: '↑ 返回上一级菜单' },
      ]} onSubmit={value => {
        if (value === '__back__') { nav.goBack(); return; }
        setSelectedId(value);
        setStep('confirm');
      }} />
    </Box>
  );
}

// ─── S7: 移除供应商绑定 ───

export function RemoveProviderBindingScreen({ agentId, config, nav }: {
  agentId: string;
  config: AgentBatonConfig;
  nav: NavProps;
}) {
  const agent = findAgent(agentId)!;
  const bindings = config.agents[agentId]?.providers ?? {};
  const entries = Object.entries(bindings);

  const [step, setStep] = useState<'select' | 'confirm' | 'done'>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [doneError, setDoneError] = useState(false);

  if (entries.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">当前没有已绑定的供应商</Text>
        <SelectMenu message="" options={[
          { value: 'back', label: '返回' },
        ]} onSubmit={() => nav.goBack()} />
      </Box>
    );
  }

  if (step === 'done') {
    return (
      <Box flexDirection="column">
        <Text color={doneError ? 'red' : 'green'}>{doneMsg}</Text>
        <SelectMenu message="" options={[
          { value: 'back', label: '返回' },
        ]} onSubmit={() => nav.navigate({ type: 'agentDetail', agentId })} />
      </Box>
    );
  }

  if (step === 'confirm' && selectedId) {
    const provider = config.providers.find(p => p.id === selectedId);
    const name = provider?.name ?? selectedId;
    return (
      <Box flexDirection="column">
        <Text>确认移除 {name} 的绑定？</Text>
        <SelectMenu message="" options={[
          { value: 'yes', label: '确认移除' },
          { value: 'no', label: '取消' },
        ]} onSubmit={async value => {
          if (value === 'no') { nav.goBack(); return; }

          const backup = bindings[selectedId];
          delete bindings[selectedId];

          try {
            await syncMultiProviderNativeConfig(agent, config);
            await saveConfig(config);
            setDoneMsg(`✅ ${agent.name} 已移除 ${name}`);
            setDoneError(false);
          } catch (e) {
            bindings[selectedId] = backup;
            setDoneMsg(`移除失败：${e instanceof Error ? e.message : String(e)}`);
            setDoneError(true);
          }
          setStep('done');
        }} />
      </Box>
    );
  }

  const options = entries.map(([key]) => {
    const p = config.providers.find(pp => pp.id === key);
    const name = p?.name ?? key;
    const keyDisplay = bindings[key].apiKey ? maskApiKey(bindings[key].apiKey!) : '(继承默认)';
    return { value: key, label: `${name}  Key: ${keyDisplay}` };
  });

  return (
    <Box flexDirection="column">
      <SelectMenu message="选择要移除的供应商：" options={[
        ...options,
        { value: '__back__', label: '↑ 返回上一级菜单' },
        { value: '__main_menu__', label: '↩ 返回主菜单' },
      ]} onSubmit={value => {
        if (value === '__back__') { nav.goBack(); return; }
        if (value === '__main_menu__') { nav.goToMainMenu(); return; }
        setSelectedId(value);
        setStep('confirm');
      }} />
    </Box>
  );
}

// ─── 工具函数 ───

async function syncMultiProviderNativeConfig(agent: AgentDefinition, config: AgentBatonConfig) {
  const agentEntry = config.agents[agent.id];
  const bindings = agentEntry?.providers ?? {};
  const existingConfig = await agent.loadNativeConfig();
  const mergedProviders: Record<string, any> = { ...existingConfig?.providers };

  for (const [providerId, binding] of Object.entries(bindings)) {
    const provider = config.providers.find(p => p.id === providerId);
    if (!provider) { continue; }
    const endpoint = provider.endpoints.find(e => e.type === agent.apiType);
    mergedProviders[providerId] = {
      apiKey: binding.apiKey ?? provider.apiKey,
      baseUrl: binding.baseUrl ?? endpoint?.baseUrl,
      models: provider.models,
    };
  }

  await agent.saveNativeConfig({ providers: mergedProviders });
}
