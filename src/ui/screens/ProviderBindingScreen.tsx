import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { SelectMenu } from '../components/SelectMenu.js';
import type { AgentBatonConfig, AgentDefinition } from '../../types/index.js';
import { findAgent } from '../../agent/builtin.js';
import { maskApiKey } from '../../utils/index.js';
import { saveConfig } from '../../config/index.js';
import type { NavProps } from '../types.js';

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
      }} onEscape={() => nav.goBack()} />
    </Box>
  );
}

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
      }} onEscape={() => nav.goBack()} />
    </Box>
  );
}

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
