import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { SelectMenu } from '../components/SelectMenu.js';
import { TextInput } from '../components/TextInput.js';
import { saveConfig } from '../../config/index.js';
import { providerPresets } from '../../provider/presets/index.js';
import { builtinAgents } from '../../agent/builtin.js';
import type { AgentBatonConfig, Provider } from '../../types/index.js';
import type { NavProps } from '../types.js';

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
      }} onEscape={() => nav.goBack()} />
    </Box>
  );
}

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
      }} onEscape={() => nav.goBack()} />
    </Box>
  );
}
