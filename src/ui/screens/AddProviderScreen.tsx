import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { SelectMenu } from '../components/SelectMenu.js';
import { TextInput } from '../components/TextInput.js';
import { saveConfig } from '../../config/index.js';
import { findProviderPreset, providerPresets } from '../../provider/presets/index.js';
import type { AgentBatonConfig, ApiType, Provider } from '../../types/index.js';
import { randomUUID } from 'node:crypto';
import type { NavProps } from '../types.js';

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
      }} onEscape={() => nav.goBack()} />
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
