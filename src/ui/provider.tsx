import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { SelectMenu } from './components/select-menu.js';
import { TextInput } from './components/text-input.js';
import { saveConfig } from '../config/index.js';
import { findProviderPreset, providerPresets } from '../provider/presets/index.js';
import { builtinAgents } from '../agent/builtin.js';
import type { AgentBatonConfig, ApiType, Provider } from '../types/index.js';
import { randomUUID } from 'node:crypto';

type NavProps = {
  navigate: (screen: any) => void;
  goBack: () => void;
  goToMainMenu: () => void;
  exit: () => void;
};

export function findProvider(config: AgentBatonConfig, providerId: string) {
  return config.providers.find(p => p.id === providerId);
}

// ─── P2: 添加供应商 ───

export function AddProviderScreen({ config, nav, returnTo }: {
  config: AgentBatonConfig;
  nav: NavProps;
  returnTo?: any;
}) {
  const [step, setStep] = useState<'select' | 'preset' | 'custom' | 'done'>('select');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [doneError, setDoneError] = useState(false);

  if (step === 'done') {
    return (
      <Box flexDirection="column">
        <Text color={doneError ? 'red' : 'green'}>{doneMsg}</Text>
        <SelectMenu message="" options={[
          { value: 'back', label: '返回' },
        ]} onSubmit={() => {
          if (returnTo) { nav.navigate(returnTo); }
          else { nav.goBack(); }
        }} />
      </Box>
    );
  }

  if (step === 'preset' && selectedPreset) {
    return <AddPresetProviderFlow presetId={selectedPreset} config={config} nav={nav}
      returnTo={returnTo} />;
  }

  if (step === 'custom') {
    return <AddCustomProviderFlow config={config} nav={nav} returnTo={returnTo} />;
  }

  return (
    <Box flexDirection="column">
      <SelectMenu message="选择模型供应商" options={[
        ...providerPresets.map(p => ({ value: p.id, label: p.name })),
        { value: '__custom__', label: '自定义模型供应商' },
        { value: '__back__', label: '↑ 返回上一级菜单' },
        { value: '__main_menu__', label: '↩ 返回主菜单' },
      ]} onSubmit={value => {
        if (value === '__back__') { nav.goBack(); return; }
        if (value === '__main_menu__') { nav.goToMainMenu(); return; }
        if (value === '__custom__') { setStep('custom'); return; }
        setSelectedPreset(value);
        setStep('preset');
      }} />
    </Box>
  );
}

function AddPresetProviderFlow({ presetId, config, nav, returnTo }: {
  presetId: string;
  config: AgentBatonConfig;
  nav: NavProps;
  returnTo?: any;
}) {
  const preset = findProviderPreset(presetId);
  const [step, setStep] = useState<'pricing' | 'apikey' | 'done'>(
    preset.pricing && preset.pricing.length > 1 ? 'pricing' : 'apikey'
  );
  const [pricingId, setPricingId] = useState<string | undefined>();
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [doneError, setDoneError] = useState(false);

  if (step === 'done') {
    return (
      <Box flexDirection="column">
        <Text color={doneError ? 'red' : 'green'}>{doneMsg}</Text>
        <SelectMenu message="" options={[
          { value: 'back', label: '返回' },
        ]} onSubmit={() => {
          if (returnTo) { nav.navigate(returnTo); }
          else { nav.goBack(); }
        }} />
      </Box>
    );
  }

  if (step === 'pricing') {
    return (
      <Box flexDirection="column">
        <SelectMenu message={`选择 ${preset.name} 的付费模式`} options={
          preset.pricing!.map(p => ({ value: p.id, label: p.name }))
        } onSubmit={value => {
          setPricingId(value);
          setStep('apikey');
        }} />
      </Box>
    );
  }

  return <TextInput
    promptMessage={`输入 ${preset.name} 的 API Key`}
    mask="*"
    onSubmit={async apiKey => {
      try {
        const pricing = pricingId
          ? preset.pricing?.find(p => p.id === pricingId)
          : preset.pricing?.find(p => p.id === 'default') ?? preset.pricing?.[0];
        const endpoints = pricing
          ? Object.values(pricing.endpoints).map(e => ({ type: e.apiType, baseUrl: e.baseUrl }))
          : [];
        const models = (preset.models ?? []).map(m => ({
          id: m.id, name: m.name, contextWindowSize: m.contextWindowSize ?? 256000,
        }));

        const newProvider: Provider = {
          id: randomUUID(), name: preset.name, apiKey,
          endpoints, models,
        };
        config.providers.push(newProvider);
        await saveConfig(config);
        setDoneMsg(`✅ 已保存 ${preset.name} 的 API Key`);
        setDoneError(false);
      } catch (e) {
        config.providers.pop();
        setDoneMsg(`添加失败：${e instanceof Error ? e.message : String(e)}`);
        setDoneError(true);
      }
      setStep('done');
    }}
    onCancel={() => { if (returnTo) nav.navigate(returnTo); else nav.goBack(); }}
  />;
}

function AddCustomProviderFlow({ config, nav, returnTo }: {
  config: AgentBatonConfig;
  nav: NavProps;
  returnTo?: any;
}) {
  const [step, setStep] = useState<'name' | 'types' | 'urls' | 'apikey' | 'done'>('name');
  const [name, setName] = useState('');
  const [apiTypes, setApiTypes] = useState<string[]>([]);
  const [urlIndex, setUrlIndex] = useState(0);
  const [urls, setUrls] = useState<string[]>([]);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [doneError, setDoneError] = useState(false);

  const goBack = () => { if (returnTo) nav.navigate(returnTo); else nav.goBack(); };

  if (step === 'done') {
    return (
      <Box flexDirection="column">
        <Text color={doneError ? 'red' : 'green'}>{doneMsg}</Text>
        <SelectMenu message="" options={[{ value: 'back', label: '返回' }]}
          onSubmit={goBack} />
      </Box>
    );
  }

  if (step === 'name') {
    return <TextInput promptMessage="输入供应商名称" placeholder="例如: My Provider"
      onSubmit={v => { setName(v); setStep('types'); }} onCancel={goBack} />;
  }

  if (step === 'types') {
    return (
      <Box flexDirection="column">
        <SelectMenu message="选择 API 类型（选一个继续）" options={[
          { value: 'openai', label: 'OpenAI' },
          { value: 'anthropic', label: 'Anthropic' },
          { value: 'google', label: 'Google' },
        ]} onSubmit={value => {
          setApiTypes([value]);
          setStep('urls');
        }} />
      </Box>
    );
  }

  if (step === 'urls') {
    const currentType = apiTypes[urlIndex];
    return <TextInput
      promptMessage={`输入 ${currentType} 的 Base URL`}
      placeholder={currentType === 'openai' ? '例如: https://api.example.com/v1' : '例如: https://api.example.com'}
      onSubmit={v => {
        const next = [...urls, v];
        setUrls(next);
        if (urlIndex + 1 >= apiTypes.length) {
          setStep('apikey');
        } else {
          setUrlIndex(urlIndex + 1);
        }
      }}
      onCancel={goBack}
    />;
  }

  if (step === 'apikey') {
    return <TextInput promptMessage="输入 API Key" mask="*" onSubmit={async apiKey => {
      try {
        const endpoints = apiTypes.map((type, i) => ({ type: type as ApiType, baseUrl: urls[i] }));
        const newProvider: Provider = {
          id: randomUUID(), name, apiKey, endpoints, models: [],
        };
        config.providers.push(newProvider);
        await saveConfig(config);
        setDoneMsg(`✅ 已添加 ${name}`);
        setDoneError(false);
      } catch (e) {
        config.providers.pop();
        setDoneMsg(`添加失败：${e instanceof Error ? e.message : String(e)}`);
        setDoneError(true);
      }
      setStep('done');
    }} onCancel={goBack} />;
  }

  return null;
}

// ─── P3: 修改供应商 ───

export function ModifyProviderScreen({ providerId, config, nav }: {
  providerId: string;
  config: AgentBatonConfig;
  nav: NavProps;
}) {
  const provider = config.providers.find(p => p.id === providerId);
  if (!provider) {
    return (
      <Box flexDirection="column">
        <Text color="red">供应商不存在</Text>
        <SelectMenu message="" options={[{ value: 'back', label: '返回' }]}
          onSubmit={() => nav.goBack()} />
      </Box>
    );
  }

  const isUsed = Object.values(config.agents).some(a => a.currentProvider === provider.id);
  const [action, setAction] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  if (doneMsg) {
    return (
      <Box flexDirection="column">
        <Text color="green">{doneMsg}</Text>
        <SelectMenu message="" options={[{ value: 'back', label: '返回' }]}
          onSubmit={() => nav.navigate({ type: 'providerSelect' })} />
      </Box>
    );
  }

  if (action === 'setModels') {
    return <SetModelsScreen provider={provider} config={config} nav={nav} />;
  }
  if (action === 'setApiKey') {
    return <TextInput promptMessage={`输入 ${provider.name} 的 API Key`} mask="*" onSubmit={async apiKey => {
      provider.apiKey = apiKey;
      await saveConfig(config);
      setDoneMsg(`✅ 已保存 ${provider.name} 的 API Key`);
    }} onCancel={() => setAction(null)} />;
  }
  if (action === 'cleanApiKey') {
    return (
      <Box flexDirection="column">
        <Text>确认清除 {provider.name} 的 API Key？</Text>
        <SelectMenu message="" options={[
          { value: 'yes', label: '确认清除' },
          { value: 'no', label: '取消' },
        ]} onSubmit={async value => {
          if (value === 'no') { setAction(null); return; }
          provider.apiKey = '';
          await saveConfig(config);
          setDoneMsg(`✅ 已清除 ${provider.name} 的 API Key`);
        }} />
      </Box>
    );
  }
  if (action === 'deleteProvider') {
    return (
      <Box flexDirection="column">
        <Text color="red">确认删除供应商 {provider.name}？此操作不可撤销。</Text>
        <SelectMenu message="" options={[
          { value: 'yes', label: '确认删除' },
          { value: 'no', label: '取消' },
        ]} onSubmit={async value => {
          if (value === 'no') { setAction(null); return; }

          for (const [agentId, agentAssignment] of Object.entries(config.agents)) {
            if (agentAssignment.currentProvider === provider.id) {
              agentAssignment.currentProvider = '';
              agentAssignment.modelSlots = {};
              const agent = builtinAgents.find(a => a.id === agentId);
              if (agent) {
                try { await agent.saveNativeConfig({ baseUrl: undefined, apiKey: undefined, models: [] }); }
                catch { /* ignore */ }
              }
            }
            if (agentAssignment.history) {
              delete agentAssignment.history[provider.id];
            }
          }

          const idx = config.providers.findIndex(p => p.id === provider.id);
          if (idx !== -1) { config.providers.splice(idx, 1); }
          try {
            await saveConfig(config);
            nav.navigate({ type: 'providerSelect' });
          } catch (e) {
            if (idx !== -1) { config.providers.splice(idx, 0, provider); }
            setDoneMsg(`删除失败：${e instanceof Error ? e.message : String(e)}`);
          }
        }} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <SelectMenu message={`设置 ${provider.name}`} options={[
        { value: 'setModels', label: '设置模型' },
        { value: 'setApiKey', label: '设置 API Key' },
        { value: 'cleanApiKey', label: '清除 API Key' },
        { value: 'deleteProvider', label: '删除此模型供应商' },
        { value: '__back__', label: '↑ 返回上一级菜单' },
        { value: '__main_menu__', label: '↩ 返回主菜单' },
      ]} onSubmit={value => {
        if (value === '__back__') { nav.goBack(); return; }
        if (value === '__main_menu__') { nav.goToMainMenu(); return; }
        setAction(value);
      }} />
    </Box>
  );
}

// ─── P4: 设置模型 ───

function SetModelsScreen({ provider, config, nav }: {
  provider: Provider;
  config: AgentBatonConfig;
  nav: NavProps;
}) {
  const [step, setStep] = useState<'menu' | 'manualId' | 'manualName' | 'done'>('menu');
  const [manualId, setManualId] = useState('');
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  if (step === 'done') {
    return (
      <Box flexDirection="column">
        <Text color="green">{doneMsg}</Text>
        <SelectMenu message="" options={[{ value: 'back', label: '返回' }]}
          onSubmit={() => nav.navigate({ type: 'modifyProvider', providerId: provider.id })} />
      </Box>
    );
  }

  if (step === 'manualId') {
    return <TextInput promptMessage="输入模型 ID" placeholder="例如: gpt-4o"
      onSubmit={v => { setManualId(v); setStep('manualName'); }}
      onCancel={() => setStep('menu')} />;
  }

  if (step === 'manualName') {
    return <TextInput promptMessage="输入模型显示名称" placeholder="例如: GPT-4o"
      onSubmit={async name => {
        provider.models.push({ id: manualId, name, contextWindowSize: 256000 });
        try {
          await saveConfig(config);
          setDoneMsg(`✅ 已添加模型 ${name}`);
        } catch (e) {
          provider.models.pop();
          setDoneMsg(`添加失败：${e instanceof Error ? e.message : String(e)}`);
        }
        setStep('done');
      }}
      onCancel={() => setStep('menu')} />;
  }

  return (
    <Box flexDirection="column">
      <SelectMenu message="选择操作" options={[
        { value: 'fetch', label: '从 API 获取模型列表' },
        { value: 'add', label: '手动添加模型' },
        { value: 'clear', label: '清空模型列表' },
        { value: '__back__', label: '↑ 返回上一级菜单' },
        { value: '__main_menu__', label: '↩ 返回主菜单' },
      ]} onSubmit={async value => {
        if (value === '__back__') { nav.goBack(); return; }
        if (value === '__main_menu__') { nav.goToMainMenu(); return; }
        if (value === 'fetch') {
          const preset = providerPresets.find(p => p.name === provider.name);
          if (!preset?.fetchModels) {
            setDoneMsg('此供应商不支持从 API 获取模型列表');
            setStep('done');
            return;
          }
          const endpoint = provider.endpoints[0];
          if (!endpoint) {
            setDoneMsg('供应商缺少 API 端点');
            setStep('done');
            return;
          }
          try {
            const models = await preset.fetchModels(endpoint.type, endpoint.baseUrl, provider.apiKey);
            provider.models = models.map(m => ({
              id: m.id, name: m.name, contextWindowSize: m.contextWindowSize ?? 256000,
            }));
            await saveConfig(config);
            setDoneMsg(`✅ 已获取 ${provider.models.length} 个模型`);
          } catch (e) {
            setDoneMsg(`获取模型失败：${e instanceof Error ? e.message : String(e)}`);
          }
          setStep('done');
        } else if (value === 'add') {
          setStep('manualId');
        } else if (value === 'clear') {
          const backup = provider.models;
          provider.models = [];
          try {
            await saveConfig(config);
            setDoneMsg('✅ 已清空模型列表');
          } catch (e) {
            provider.models = backup;
            setDoneMsg(`清空失败：${e instanceof Error ? e.message : String(e)}`);
          }
          setStep('done');
        }
      }} />
    </Box>
  );
}
